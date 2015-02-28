import path from 'path'
import Promise from 'bluebird'
import fs from 'fs'
import mkdirp from 'mkdirp'
// TODO: import mozilla source map library

function generateJsSourceMappingComment(mapPath) {
  // TODO:
}

function generateCssSourceMappingComment(mapPath) {
  // TODO:
}

function writeResource(outputDir, resource) {
  var outputPath = path.join(outputDir, resource.filePath)

  var promise = Promise.promisify(mkdirp)(path.dirname(outputPath))
  .then(() => {
    return Promise.promisify(fs.writeFile)(outputPath, resource.data)
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
      return Promise.promisify(fs.writeFile)(path.join(outputDir, mapPath), map)
    })
  }

  return promise
}

export default function(stream, outputDir) {
}
