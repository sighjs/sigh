import path from 'path'
import Bacon from 'baconjs'
import _ from 'lodash'
var babel = require('babel') // not sure why have to do it this way for babel...

import { mapEvents } from '../stream'

function compileEvent(opts, event) {
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

  if (event.basePath)
    babelOpts.filenameRelative = event.projectDir

  try {
    var result = babel.transform(event.data, babelOpts)
  }
  catch (e) {
    return new Bacon.Error(e.toString())
  }

  event.data = result.code
  event.applySourceMap(result.map)
  return event
}

export default function(op, opts) {
  opts = _.assign({ modules: 'amd' }, opts || {})
  return mapEvents(op.stream, compileEvent.bind(this, opts))
}
