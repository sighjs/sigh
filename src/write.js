import path from 'path'
import mercator from 'mercator'
import Promise from 'bluebird'
import fs from 'fs'
import mkdirp from 'mkdirp'

function writeResource(outputDir, resource) {
  var outputPath = path.join(outputDir, resource.filePath)

  var promise = Promise.try(() => {
    return Promise.promisify(mkdirp)(path.dirname(outputPath))
  })
  .then(() => {
    return Promise.promisify(fs.writeFile)(outputPath, resource.data)
  })

  if (resource.map) {
    var mapPath = resource.sourceMapFileName
    var suffix
    if (resource.type === 'js')
      suffix = mercator.generateJsSourceMappingComment(mapPath)
    else if (resource.type === 'css')
      suffix = mercator.generateCssSourceMappingComment(mapPath)

    if (suffix)
      resource.data += '\n' + suffix

    promise = promise.then(() => {
      var map = resource.map.rebaseSourcePaths(outputDir)
      return Promise.promisify(fs.writeFile)(path.join(outputDir, mapPath), map)
    })
  }

  return promise
}

export default function(outputDir) {
  return operation => {
    console.log("write: => %j", operation.inputs)
    return Promise.all(
      operation.inputs.map(writeResource.bind(this, outputDir))
    )
    .then(() => undefined)
  }
}
