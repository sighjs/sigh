import traceur from 'traceur'
import path from 'path'

export default function(opts) {
  if (! opts)
    opts = {}
  var modules = opts.modules || 'amd'

  var compiler = new traceur.Compiler({ modules: modules, sourceMaps: true })
  var cwd = process.cwd()

  return operation => {
    return operation.inputs.map(resource => {
      var relPath = path.relative(cwd, resource.filePath)
      var base = path.basename(relPath)

      resource.data = compiler.compile(resource.data, relPath, relPath, base)
      resource.applyMap(compiler.getSourceMap())

      return resource
    })
  }
}
