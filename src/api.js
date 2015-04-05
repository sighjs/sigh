import fs from 'fs'
import _ from 'lodash'
import Promise from 'bluebird'
import rewire from 'rewire'
import path from 'path'
import Bacon from 'baconjs'

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

    return compileSighfile(compiler, opts)
    .then(_streams => {
      streams = _streams

      if (opts.verbose)
        console.info('waiting for subprocesses: %s', Date.now())
      return compiler.procPool.ready()
    })
    .then(() => {
      if (opts.verbose)
        console.info('subprocesses started:     %s', Date.now())

      _.forEach(streams, (stream, pipelineName) => {
        stream.onValue(events => {
          var now = new Date

          var createTime = _.min(events, 'createTime').createTime
          var timeDuration = createTime ?
            (now.getTime() - createTime.getTime()) / 1000 : 'unknown'

          // TODO: show more content on verbose
          console.log('pipeline %s complete - %s seconds', pipelineName, timeDuration)
        })
        stream.onError(error => {
          console.warn('\x07error: pipeline %s', pipelineName)
          console.warn(error)
        })
      })

      Bacon.mergeAll(_.values(streams)).onEnd(() => {
        if (opts.verbose)
          console.info('pipeline(s) complete:     %s', Date.now())
        compiler.destroy()
      })
    })
  }
  catch (e) {
    if (typeof e === 'function' && e instanceof Error) {
      // TODO: add some red stuff before it
      console.warn(e.message)
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

  var sighModule = rewire(path.join(process.cwd(), 'Sigh'))
  _.forEach(plugins, (plugin, key) => injectPlugin(sighModule, key))

  var pipelines = {}
  sighModule(pipelines)

  if (opts.pipelines && opts.pipelines.length) {
    Object.keys(pipelines).forEach(name => {
      if (opts.pipelines.indexOf(name) === -1)
        delete pipelines[name]
    })
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
