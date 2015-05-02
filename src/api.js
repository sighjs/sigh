import fs from 'fs'
import _ from 'lodash'
import Promise from 'bluebird'
import rewire from 'rewire'
import path from 'path'
import Bacon from 'baconjs'
import functionLimit from 'process-pool/lib/functionLimit'

import log from 'sigh-core/lib/log'
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
    var exitCode = 0
    var streams
    var compiler = new PipelineCompiler(opts)

    var startTime = Date.now()
    var relTime = (time = startTime) => ((Date.now() - time) / 1000).toFixed(3)

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
      var pipeStartTime = Date.now()

      _.forEach(streams, (stream, pipelineName) => {
        stream.onValue(events => {
          var now = new Date

          var createTime = _.min(events, 'createTime').createTime
          var timeDuration = relTime(createTime ? createTime.getTime() : pipeStartTime)

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
          exitCode = 1
          log.warn('\x07error: pipeline %s', pipelineName)
          log.warn(error)
        })
      })

      Bacon.mergeAll(_.values(streams)).onEnd(() => {
        if (opts.verbose)
          log('pipeline(s) complete: %s seconds', relTime())
        compiler.destroy()

        process.exit(exitCode)
      })
    })
  }
  catch (e) {
    if (typeof e === 'function' && e instanceof Error) {
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

  var notPlugin = { 'sigh-cli': true, 'sigh-core' : true }

  if (packageJson) {
    [ packageJson.devDependencies, packageJson.dependencies ].forEach(deps => {
      if (! deps)
        return

      _.forEach(deps, function(version, pkg) {
        if (/^sigh-/.test(pkg) && ! notPlugin[pkg])
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

  var pipelines = { alias: {}, explicit: {} }
  sighModule(pipelines)

  var selectedPipelines = selectPipelines(opts.pipelines, pipelines)
  var runPipelines = loadPipelineDependencies(selectedPipelines, pipelines)

  if (opts.verbose) {
    log(
      'running pipelines [ %s ] with %s jobs',
      Object.keys(runPipelines).join(', '),
      opts.jobs
    )
  }

  // to ensure the promises run one after the other so that plugins load
  // in dependency order, ideally they could be segmented according to
  // dependencies and loaded in several asynchronous batches.
  var limiter = functionLimit(func => func(), 1)

  return Promise.props(
    _.mapValues(runPipelines, (pipeline, name) => limiter(() => {
      // This ensures that user selected pipeline's input streams are
      // merged with the init stream.
      var inputStream = selectedPipelines[name] ? compiler.initStream : null
      return compiler.compile(pipeline, inputStream, name)
    }))
  )
}

function selectPipelines(selected, pipelines) {
  if (! selected || selected.length === 0)
    return _.omit(pipelines, 'alias', 'explicit')

  if (! _.isEmpty(pipelines.alias)) {
    selected = _.flatten(
      selected.map(pipelineName => {
        return pipelines.alias[pipelineName] || pipelineName
      })
    )
  }

  if (! _.isEmpty(pipelines.explicit)) {
    selected.forEach(pipelineName => {
      var explicitPipeline = pipelines.explicit[pipelineName]
      if (explicitPipeline)
        pipelines[pipelineName] = explicitPipeline
    })
  }

  var runPipelines = {}
  Object.keys(pipelines).forEach(name => {
    if (selected.indexOf(name) !== -1)
      runPipelines[name] = pipelines[name]
  })

  return runPipelines
}

/**
 * @arg {Object} runPipelines A map of pipelines the user has chosen to run by name.
 * @arg {Object} pipelines A map of all pipelines by name.
 * @return {Object} A map of pipelines that should be run with dependents after dependencies.
 */
function loadPipelineDependencies(runPipelines, pipelines) {
  var ret = {}
  var loading = {}

  var loadDeps = srcPipelines => {
    _.forEach(srcPipelines, (pipeline, name) => {
      if (ret.name)
        return
      else if (loading.name)
        throw Error(`circular dependency from pipeline ${name}`)

      loading[name] = true

      // TODO: also cursively scan args, e.g. if used in merge
      var activations = []

      // ignore pipelines in the first position as they only provide output, not
      // input and this can be associated dynamically through a flatMap
      pipeline.slice(1).forEach(pluginMeta => {
        if (pluginMeta.plugin === plugins.pipeline) {
          var activateState = false
          pluginMeta.args.forEach(arg => {
            if (arg.hasOwnProperty('activate'))
              activateState = arg.activate
            else if (activateState)
              activations.push(arg)
          })
        }
      })

      // this pipeline must come before those it activates
      ret[name] = pipeline

      activations.forEach(activation => {
        var activationPipeline = pipelines[activation] || pipelines.explicit[activation]
        if (! activationPipeline)
          throw Error(`invalid pipeline ${activation}`)

        ret[activation] = activationPipeline
      })

      delete loading[name]
    })
  }

  loadDeps(runPipelines)

  return ret
}

function injectPlugin(module, pluginName) {
  var plugin = plugins[pluginName]
  if (! plugin)
    throw new Error("Nonexistent plugin `" + pluginName + "'")

  try {
    var varName = pluginName.replace(/(\w)-(\w)/, (match, $1, $2) => $1 + $2.toUpperCase())

    module.__set__(varName, (...args) => ({ plugin, args }))
  }
  catch (e) {
    // plugin not used
  }
}
