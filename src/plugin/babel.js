import path from 'path'
import Bacon from 'baconjs'
import _ from 'lodash'

import { mapEvents } from '../stream'

function eventCompiler(opts) {
  var babel = require('babel')
  var _ = require('lodash')

  return function(event) {
    if (event.type !== 'add' && event.type !== 'change')
      return event

    var babelOpts = {
      modules: opts.modules,
      filename: event.path,
      sourceMap: true,
      moduleIds: true
    }

    if (opts.modules === 'amd') {
      var modulePath = event.projectPath.replace(/\.js$/, '')
      if (opts.getModulePath)
        modulePath = opts.getModulePath(modulePath)
      babelOpts.moduleId = modulePath
    }

    // if (event.basePath)
    //   babelOpts.filenameRelative = event.basePath

    var result = babel.transform(event.data, babelOpts)
    return _.pick(result, 'code', 'map')
  }
}

// (de)serialise argument to and result of babel subprocess
function adaptEvent(compiler) {
  return event => {
    var result = compiler(_.pick(event, 'type', 'data', 'path', 'projectPath'))

    // without proc pool a Promise.resolve is needed here
    return result.then(result => {
      event.data = result.code
      event.applySourceMap(result.map)
      return event
    })
  }
}

export default function(op, opts) {
  opts = _.assign({ modules: 'amd' }, opts || {})

  // without proc pool:
  // return mapEvents(op.stream, adaptEvent(eventCompiler(opts)))

  return mapEvents(op.stream, adaptEvent(op.procPool.prepare(eventCompiler, opts)))
}
