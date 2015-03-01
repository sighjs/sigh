import path from 'path'
import Promise from 'bluebird'
// TODO: import mozilla source map library

var writeFile = Promise.promisify(require('fs').writeFile)
var ensureDir = Promise.promisify(require('fs-extra').ensureDir)

function generateJsSourceMappingComment(mapPath) {
  // TODO:
}

function generateCssSourceMappingComment(mapPath) {
  // TODO:
}

function writeResource(outputDir, resource) {
  var outputPath = path.join(outputDir, resource.filePath)

  var promise = ensureDir(path.dirname(outputPath)).then(() => {
    return writeFile(outputPath, resource.data)
  })

  if (resource.map) {
    var mapPath = resource.sourceMapFileName
    var suffix
    if (resource.type === 'js')
      suffix = generateJsSourceMappingComment(mapPath)
    else if (resource.type === 'css')
      suffix = generateCssSourceMappingComment(mapPath)

    if (suffix)
      resource.data += '\n' + suffix

    promise = promise.then(() => {
      var map = resource.map.rebaseSourcePaths(outputDir)
      return writeFile(path.join(outputDir, mapPath), map)
    })
  }

  return promise
}

export default function(stream, outputDir) {
  // TODO: adapt stream
  return stream
}
