import fs from 'fs'
import _ from 'lodash'
import rewire from 'rewire'
import path from 'path'

import PipelineCompiler from './PipelineCompiler'
import all from './plugin/all'
import concat from './plugin/concat'
import glob from './plugin/glob'
import babel from './plugin/babel'
import write from './plugin/write'

var plugins = { all, concat, glob, babel, write }

// Run Sigh.js
export function invoke(opts) {
  try {
    invokeHelper(opts)
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

/// Run the Sigh.js file in the current directory with the given options.
function invokeHelper(opts) {
  var packageJson = JSON.parse(fs.readFileSync('package.json'))
  ; [ packageJson.devDependencies, packageJson.dependencies ].forEach(deps => {
    if (! deps)
      return

    _.forEach(deps, function(version, pkg) {
      if (/^sigh-/.test(pkg) && pkg !== 'sigh-cli')
        plugins[pkg.substr(5)] = require(path.join(process.cwd(), 'node_modules', pkg))
    })
  })

  var sighModule = rewire(path.join(process.cwd(), 'Sigh'))
  _.forEach(plugins, (plugin, key) => injectPlugin(sighModule, key))

  var pipelines = {}
  sighModule(pipelines)

  if (opts.pipelines.length) {
    Object.keys(pipelines).forEach(name => {
      if (opts.pipelines.indexOf(name) === -1)
        delete pipelines[name]
    })
  }

  var compiler = new PipelineCompiler(opts)
  // operation by pipeline name
  var streams = _.mapValues(pipelines, compiler.compile.bind(compiler))

  _.forEach(streams, (stream, pipelineName) => {
    stream.onValue(value => {
      // TODO: if (verbose) show value also
      console.log('pipeline %s complete', pipelineName)
    })
    stream.onError(error => {
      console.warn('\x07error: pipeline %s - %j', pipelineName, error)
    })
  })
}

function injectPlugin(module, pluginName) {
  var plugin = plugins[pluginName]
  if (! plugin)
    throw new Error("Nonexistent plugin `" + pluginName + "'")

  try {
    var varName = pluginName.replace(/-/g, '_')
    module.__set__(varName, (...args) => ({ plugin, args }))
  }
  catch (e) {
    throw new Error("Sigh.js needs `var " + pluginName + "' statement")
  }
}
