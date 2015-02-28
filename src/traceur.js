import traceur from 'traceur'
import path from 'path'

var opts = {}

function compileFile(filePath, data) {
  var cwd = process.cwd()
  var relPath = path.relative(cwd, filePath)
  var base = path.basename(relPath)

  var compiler
  if (opts.modules === 'amd') {
    var modulePath = relPath.replace(/\.js$/, '')
    if (opts.getModulePath)
        modulePath = opts.getModulePath(modulePath)

    compiler = new traceur.Compiler({
      modules: opts.modules,
      sourceMaps: true,
      moduleName: modulePath
    })
  }
  else {
    compiler = new traceur.Compiler({ modules: modules, sourceMaps: true })
  }

  var compiled = compiler.compile(data, relPath, relPath, base)
  return { compiled, sourceMap: compiler.getSourceMap() }
}

export default function(stream, _opts) {
  opts = _.assign({ modules: 'amd' }, _opts || {})

  // TODO: adapt stream
  return stream
}
