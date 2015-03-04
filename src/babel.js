var babel = require('babel')
import path from 'path'
import _ from 'lodash'

import { mapEvents } from './stream'

function compileEvent(opts, event) {
  if (event.type !== 'add' && event.type !== 'change')
    return event

  var babelOpts = {
    sourceRoot: event.baseDir || process.cwd(),
    modules: opts.modules,
    filename: event.path,
    sourceMap: true,
    moduleIds: true
  }

  if (opts.modules === 'amd') {
    var modulePath = event.projectPath.replace(/\.js$/, '')
    if (opts.getModulePath)
      modulePath = opts.getModulePath(modulePath)

    // TODO: only necessary if getModulePath is defined?
    babelOpts.moduleId = modulePath
  }

  if (event.baseDir) {
    babelOpts.sourceRoot = event.baseDir
    babelOpts.filenameRelative = event.projectDir
  }

  var result = babel.transform(event.data, babelOpts)

  event.data = result.code
  event.applySourceMap(event.map)
  return event
}

export default function(stream, opts) {
  opts = _.assign({ modules: 'amd' }, opts || {})
  return mapEvents(stream, compileEvent.bind(this, opts))
}
