import fs from 'fs'
import _ from 'lodash'
import rewire from 'rewire'
import path from 'path'

import { UserError, rootErrorHandler } from './errors'
import Resource from './Resource'
import Operation from './Operation'

export { UserError, Resource, Operation }

// should be in seperate directory :(
// see: https://github.com/google/traceur-compiler/issues/1538
import glob from './glob'
import all from './all'
import concat from './concat'
import write from './write'

var plugins = { glob, all, concat, write }

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
  var sighPkgs = []

  var packageJson = JSON.parse(fs.readFileSync('package.json'))
  ; [ packageJson.devDependencies, packageJson.dependencies ].forEach(deps => {
    if (! deps)
      return

    _.forEach(deps, function(version, pkg) {
      if (/^sigh-/.test(pkg))
        sighPkgs.push(pkg)
    })
  })

  // TODO: also inject package.json dependencies
  var sighModule = rewire(path.join(process.cwd(), 'Sigh'))
  _.forEach(plugins, (plugin, key) => injectPlugin(sighModule, key))

  var pipelines = {}
  sighModule(pipelines)

  // console.log("TODO: invoke sigh %j", opts)
  if (opts.pipelines.length) {
    Object.keys(pipelines).forEach(name => {
      if (opts.pipelines.indexOf(name) === -1)
        delete pipelines[name]
    })
  }

  pipelines = _.mapValues(pipelines, (pipeline, name) => {
    return _.reduceRight(pipeline, (nextFunc, opFunc) => {
      return new Operation(opFunc, nextFunc)
    }, new Operation(pipeline.pop()))
  })

  _.forEach(pipelines, pipeline => {
    pipeline.execute('build').catch(rootErrorHandler)
  })
}

function injectPlugin(module, pluginName) {
  var plugin = plugins[pluginName]
  if (! plugin)
    throw new UserError("Non-existant plugin `" + pluginName + "'")

  try {
    module.__set__(pluginName, plugin)
  }
  catch (e) {
    throw new UserError("Sigh.js needs `var " + pluginName + "' statement")
  }
}
