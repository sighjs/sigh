import traceur from 'traceur'
import path from 'path'
import _ from 'lodash'

import { mapEvents } from './stream'

function compileEvent(opts, event) {
  if (event.type !== 'add' && event.type !== 'change')
    return event

  var projectPath = event.projectPath

  var compiler
  if (opts.modules === 'amd') {
    var modulePath = projectPath.replace(/\.js$/, '')
    if (opts.getModulePath)
      modulePath = opts.getModulePath(modulePath)

    compiler = new traceur.Compiler({
      modules: opts.modules,
      sourceRoot: event.baseDir || process.cwd(),
      sourceMaps: true,
      moduleName: modulePath
    })
  }
  else {
    compiler = new traceur.Compiler({ modules: opts.modules, sourceMaps: true })
  }

  var compiled = compiler.compile(
    event.data, projectPath, projectPath, path.basename(projectPath)
  )

  event.data = compiled
  event.applySourceMap(compiler.getSourceMap())
  return event
}

export default function(stream, opts) {
  opts = _.assign({ modules: 'amd' }, opts || {})
  return mapEvents(stream, compileEvent.bind(this, opts))
}
