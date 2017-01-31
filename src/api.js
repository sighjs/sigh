import fs from 'fs'
import _ from 'lodash'
import Promise from 'bluebird'
import rewire from 'rewire'
import path from 'path'
import activeCallLimiter from 'process-pool/lib/activeCallLimiter'

import { log, Bacon } from 'sigh-core'

import PipelineCompiler from './PipelineCompiler'
import gulpAdapter from './gulp-adapter'

import merge from './plugin/merge'
import concat from './plugin/concat'
import debounce from './plugin/debounce'
import env from './plugin/env'
import glob from './plugin/glob'
import pipeline from './plugin/pipeline'
import write from './plugin/write'
import filter from './plugin/filter'

const plugins = {
  merge, concat, debounce, env, glob, pipeline, write,
  select: filter.bind(null, true),
  reject: filter.bind(null, false),
}

/**
 * Run Sigh.js
 * @return {Promise} Resolves to an object { pipelineName: baconStream }
 */
export function invoke(opts = {}) {
  try {
    let exitCode = 0
    let streams
    const compiler = new PipelineCompiler(opts)

    const startTime = Date.now()
    const relTime = (time = startTime) => ((Date.now() - time) / 1000).toFixed(3)

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
      const pipeStartTime = Date.now()

      _.forEach(streams, (stream, pipelineName) => {
        stream.onValue(events => {
          const now = new Date

          const createTime = _.min(events, 'createTime').createTime
          const timeDuration = relTime(createTime ? createTime.getTime() : pipeStartTime)

          log('pipeline %s complete: %s seconds', pipelineName, timeDuration)
          if (opts.verbose > 1) {
            events.forEach(event => {
              const { path, projectPath } = event
              const suffix = path !== projectPath ? ` [${event.projectPath}]` : ''
              log.nested(`${event.type} ${event.path}${suffix}`)
            })
          }
        })

        stream.onError(error => {
          exitCode = 1
          log.warn('\x07error: pipeline %s', pipelineName)
          log.warn(error)
          if (error.stack)
            log.warn(error.stack)
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
      log.warn(e)
      if (e.stack)
        log.warn(e.stack)
      process.exit(1)
    }
    else {
      throw e
    }
  }
}

/**
 * Requires a plugin ensuring es6 modules are also supported
 */
function requirePlugin(path) {
  const module = require(path)
  return module.default || module
}

/**
 * Compile the Sigh.js file in the current directory with the given options.
 * @return {Promise} Resolves to an object { pipelineName: baconStream }
 */
export function compileSighfile(compiler, opts = {}) {
  let packageJson
  try {
    packageJson = JSON.parse(fs.readFileSync('package.json'))
  }
  catch (e) {}

  const notPlugin = { 'sigh-cli': true, 'sigh-core' : true }

  if (packageJson) {
    [ packageJson.devDependencies, packageJson.dependencies ].forEach(deps => {
      if (! deps)
        return

      _.forEach(deps, function(version, pkg) {
        if (notPlugin[pkg])
          return

        if (/^sigh-/.test(pkg)) {
          plugins[pkg.substr(5)] = requirePlugin(path.join(process.cwd(), 'node_modules', pkg))
        }
        else if (/^gulp-/.test(pkg)) {
          const name = pkg.substr(5)
          if (! plugins[name])
            plugins[name] = gulpAdapter(requirePlugin(path.join(process.cwd(), 'node_modules', pkg)))
        }
      })
    })
  }

  let sighPath
  try {
    sighPath = require.resolve(path.join(process.cwd(), 'Sigh'))
  }
  catch (e) {
    sighPath = require.resolve(path.join(process.cwd(), 'sigh'))
  }

  const sighModule = rewire(sighPath)
  _.forEach(plugins, (plugin, key) => injectPlugin(sighModule, key))

  const pipelines = { alias: {}, explicit: {} }
  sighModule(pipelines)

  const selectedPipelines = selectPipelines(opts.pipelines, pipelines)
  const runPipelines = loadPipelineDependencies(selectedPipelines, pipelines)

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
  const limiter = activeCallLimiter(func => func(), 1)

  return Promise.props(
    _.mapValues(runPipelines, (pipeline, name) => limiter(() => {
      // This ensures that user selected pipeline's input streams are
      // merged with the init stream.
      const inputStream = selectedPipelines[name] ? compiler.initStream : null
      return compiler.compile(pipeline, inputStream, name)
    }))
  )
}

/**
 * Select pipelines, then _.assign(pipelines, pipelines.explicit) ; delete pipelines.explicit
 * @param {Object} pipelines All pipelines by name and two extra keys, alias and explicit.
 *                           After this function returns the explicit pipelines will be
 *                           merged with the main pipelines and then the key will be deleted.
 * @return {Object} Pipeline name against pipeline in the order the user selected them.
 */
function selectPipelines(selected, pipelines) {
  if (! selected || selected.length === 0)
    selected = Object.keys(_.omit(pipelines, 'alias', 'explicit'))

  if (! _.isEmpty(pipelines.alias)) {
    selected = _.flatten(
      selected.map(pipelineName => {
        return pipelines.alias[pipelineName] || pipelineName
      })
    )
  }

  _.defaults(pipelines, pipelines.explicit)
  delete pipelines.explicit

  const runPipelines = {}
  selected.forEach(name => {
    runPipelines[name] = pipelines[name]
  })

  return runPipelines
}

/**
 * Reverse the order of keys in a hash.
 * Works in any JS VM that maintains key insertion order.
 */
function reverseHash(hash) {
  const ret = {}
  Object.keys(hash).reverse().forEach(key => { ret[key] = hash[key] })
  return ret
}

/**
 * @arg {Object} runPipelines A map of pipelines the user has chosen to run by name.
 * @arg {Object} pipelines A map of all pipelines by name.
 * @return {Object} A map of pipelines that should be run with dependents after dependencies.
 */
function loadPipelineDependencies(runPipelines, pipelines) {
  const ret = {}
  const loading = {}

  const loadDeps = srcPipelines => {
    _.forEach(srcPipelines, (pipeline, name) => {
      if (ret.name)
        return
      else if (loading.name)
        throw Error(`circular dependency from pipeline ${name}`)

      loading[name] = true

      // TODO: also cursively scan args, e.g. if used in merge
      const activations = []

      // ignore pipelines in the first position as they only provide output, not
      // input and this can be associated dynamically through a flatMap
      // TODO: if this pipeline itself has input then the above comment no
      //       longer applies.
      let skipNextLeaf = true

      const scanPipelineForActivation = pipeline => {
        pipeline.forEach(pluginMeta => {
          if (pluginMeta.plugin === plugins.merge) {
            scanPipelineForActivation(pluginMeta.args)
            return
          }

          if (skipNextLeaf) {
            skipNextLeaf = false
            return
          }

          if (pluginMeta.plugin === plugins.pipeline) {
            let activateState = false
            pluginMeta.args.forEach(arg => {
              if (arg.hasOwnProperty('activate'))
                activateState = arg.activate
              else if (activateState)
                activations.push(arg)
            })
          }
        })
      }

      scanPipelineForActivation(pipeline)

      activations.forEach(activation => {
        const activationPipeline = pipelines[activation]
        if (! activationPipeline)
          throw Error(`invalid pipeline ${activation}`)

        ret[activation] = activationPipeline
      })

      // this pipeline must come after those it activates so that
      // the dependency order is preserved after the list is reserved.
      ret[name] = pipeline

      delete loading[name]
    })
  }


  loadDeps(reverseHash(runPipelines))

  return reverseHash(ret)
}

function injectPlugin(module, pluginName) {
  const plugin = plugins[pluginName]
  if (! plugin)
    throw new Error("Nonexistent plugin `" + pluginName + "'")

  try {
    const varName = _.camelCase(pluginName)

    module.__set__(varName, (...args) => ({ plugin, args }))
  }
  catch (e) {
    // plugin not used
  }
}
