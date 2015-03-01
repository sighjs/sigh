import traceur from 'traceur'
import path from 'path'
import Promise from 'bluebird'
var { Bacon } = require('baconjs')
// TODO: import mozilla source map library

var writeFile = Promise.promisify(require('fs').writeFile)
var ensureDir = Promise.promisify(require('fs-extra').ensureDir)

function generateJsSourceMappingComment(mapPath) {
  // TODO:
}

function generateCssSourceMappingComment(mapPath) {
  // TODO:
}

export function writeEvent(outputDir, event) {
  if (event.type === 'remove') {
    // TODO: remove path
    return
  }

  var outputPath = path.join(outputDir, event.path)

  var promise = ensureDir(path.dirname(outputPath)).then(() => {
    return writeFile(outputPath, event.data)
  })

  if (event.map) {
    var mapPath = event.sourceMapFileName
    var suffix
    if (event.fileType === 'js')
      suffix = generateJsSourceMappingComment(mapPath)
    else if (event.fileType === 'css')
      suffix = generateCssSourceMappingComment(mapPath)

    if (suffix)
      event.data += '\n' + suffix

    promise = promise.then(() => {
      var map = event.map.rebaseSourcePaths(outputDir)
      return writeFile(path.join(outputDir, mapPath), map)
    })
  }

  return promise.then(() => event)
}

export default function(stream, outputDir) {
  return stream.flatMap(event => {
    return Bacon.fromPromise(writeEvent(outputDir, event))
  })
}
