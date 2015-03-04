var babel = require('babel')
import path from 'path'
import _ from 'lodash'

import { mapEvents } from './stream'

function compileEvent(opts, event) {
  if (event.type !== 'add' && event.type !== 'change')
    return event

  var babelOpts = {
    sourceRoot: event.basePath || process.cwd(),
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

  var result = babel.transform(event.data, babelOpts)

  event.data = result.code
  event.applySourceMap(result.map)
  return event
}

export default function(stream, opts) {
  opts = _.assign({ modules: 'amd' }, opts || {})
  return mapEvents(stream, compileEvent.bind(this, opts))
}
