import traceur from 'traceur'
import path from 'path'

export default function(opts) {
  if (! opts)
    opts = {}
  var modules = opts.modules || 'amd'

  var compiler = new traceur.Compiler({ modules: modules, sourceMaps: true })
  var cwd = process.cwd()

  return operation => {
    return operation.inputs.map(input => {
      var relPath = path.relative(cwd, input.filePath)
      var base = path.basename(relPath)

      input.data = compiler.compile(input.data, relPath, relPath, base)
      input.applyMap(compiler.getSourceMap())

      return input
    })
  }
}
