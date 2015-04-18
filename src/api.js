import fs from 'fs'
import _ from 'lodash'
import Promise from 'bluebird'
import rewire from 'rewire'
import path from 'path'
import Bacon from 'baconjs'

import log from './log'
import PipelineCompiler from './PipelineCompiler'
import merge from './plugin/merge'
import babel from './plugin/babel'
import concat from './plugin/concat'
import debounce from './plugin/debounce'
import env from './plugin/env'
import glob from './plugin/glob'
import pipeline from './plugin/pipeline'
import write from './plugin/write'

var plugins = { merge, babel, concat, debounce, env, glob, pipeline, write }

/**
 * Run Sigh.js
 * @return {Promise} Resolves to an object { pipelineName: baconStream }
 */
export function invoke(opts = {}) {
  try {
    var streams
    var compiler = new PipelineCompiler(opts)

    var startTime = Date.now()
    var relTime = () => ((Date.now() - startTime) / 1000).toFixed(3)

    return compileSighfile(compiler, opts)
    .then(_streams => {
      streams = _streams

      if (opts.verbose)
        log('waiting for subprocesses to start')
      return compiler.procPool.ready()
    })
    .then(() => {
      if (opts.verbose)
        log('subprocesses started in %s seconds', relTime())

      _.forEach(streams, (stream, pipelineName) => {
        stream.onValue(events => {
          var now = new Date

          var createTime = _.min(events, 'createTime').createTime
          var timeDuration = createTime ?
            (now.getTime() - createTime.getTime()) / 1000 : 'unknown'

          if (opts.verbose > 1) {
            log(
              'pipeline %s complete: %s seconds %j',
              pipelineName,
              timeDuration,
              _.map(events, event => _.pick(event, 'type', 'path'))
            )
          }
          else {
            log('pipeline %s complete: %s seconds', pipelineName, timeDuration)
          }
        })
        stream.onError(error => {
          log.warn('\x07error: pipeline %s', pipelineName)
          log.warn(error)
        })
      })

      Bacon.mergeAll(_.values(streams)).onEnd(() => {
        if (opts.verbose)
          log('pipeline(s) complete: %s seconds', relTime())
        compiler.destroy()
      })
    })
  }
  catch (e) {
    if (typeof e === 'function' && e instanceof Error) {
      // TODO: add some red stuff before it
      log.warn(e.message)
      process.exit(1)
    }
    else {
      throw e
    }
  }
}

/**
 * Compile the Sigh.js file in the current directory with the given options.
 * @return {Promise} Resolves to an object { pipelineName: baconStream }
 */
export function compileSighfile(compiler, opts = {}) {
  try {
    var packageJson = JSON.parse(fs.readFileSync('package.json'))
  }
  catch (e) {}

  if (packageJson) {
    [ packageJson.devDependencies, packageJson.dependencies ].forEach(deps => {
      if (! deps)
        return

      _.forEach(deps, function(version, pkg) {
        if (/^sigh-/.test(pkg) && pkg !== 'sigh-cli')
          plugins[pkg.substr(5)] = require(path.join(process.cwd(), 'node_modules', pkg))
      })
    })
  }

  var sighModule
  try {
    sighModule = rewire(path.join(process.cwd(), 'sigh'))
  }
  catch (e) {
    sighModule = rewire(path.join(process.cwd(), 'Sigh'))
  }

  _.forEach(plugins, (plugin, key) => injectPlugin(sighModule, key))

  var pipelines = {}, aliases = {}
  pipelines.alias = (name, ...sources) => {
    sources = _.flatten(sources)
    aliases[name] = sources
  }
  sighModule(pipelines)
  delete pipelines.alias

  if (opts.pipelines && opts.pipelines.length) {
    if (! _.isEmpty(aliases)) {
      opts.pipelines = _.flatten(
        opts.pipelines.map(pipelineName => aliases[pipelineName] || pipelineName)
      )
    }

    Object.keys(pipelines).forEach(name => {
      if (opts.pipelines.indexOf(name) === -1)
        delete pipelines[name]
    })
  }

  if (opts.verbose) {
    log(
      'running pipelines [ %s ] with %s jobs',
      Object.keys(pipelines).join(', '),
      opts.jobs
    )
  }

  return Promise.props(
    _.mapValues(pipelines, (pipeline, name) => compiler.compile(pipeline, null, name))
  )
}

function injectPlugin(module, pluginName) {
  var plugin = plugins[pluginName]
  if (! plugin)
    throw new Error("Nonexistent plugin `" + pluginName + "'")

  try {
    // TODO: make camelCase instead
    var varName = pluginName.replace(/-/g, '_')
    module.__set__(varName, (...args) => ({ plugin, args }))
  }
  catch (e) {
    // plugin not used
  }
}
