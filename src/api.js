import fs from 'fs'
import _ from 'lodash'
import rewire from 'rewire'
import path from 'path'

// should be in seperate directory :(
// see: https://github.com/google/traceur-compiler/issues/1538
// TODO: this is fixed now, can it be changed?
import all from './all'
import concat from './concat'
import glob from './glob'
import traceur from './traceur'
import write from './write'

var plugins = { all, concat, glob, traceur, write }

// Run Sigh.js
export function invoke(opts) {
  try {
    invokeHelper(opts)
  }
  catch (e) {
    if (typeof e === 'function' && e instanceof UserError) {
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

  // operation by pipeline name
  var streams = _.mapValues(pipelines, pipelineToStream)

  _.forEach(streams, (stream, pipelineName) => {
    // TODO: start stream
  })
}

function pipelineToStream(pipeline) {
  console.log('TODO: convert pipeline to bacon stream', pipeline)
}

function injectPlugin(module, pluginName) {
  var plugin = plugins[pluginName]
  if (! plugin)
    throw new UserError("Non-existant plugin `" + pluginName + "'")

  try {
    var varName = pluginName.replace(/-/g, '_')
    module.__set__(varName, (...args) => ({ plugin: pluginName, args }))
  }
  catch (e) {
    throw new UserError("Sigh.js needs `var " + pluginName + "' statement")
  }
}
