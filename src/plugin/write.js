import path from 'path'
import Promise from 'bluebird'
import fs from 'fs'
var writeFile = Promise.promisify(fs.writeFile)
var unlink = Promise.promisify(fs.unlink)
var ensureDir = Promise.promisify(require('fs-extra').ensureDir)

import { mapEvents } from '../stream'
import { generateIdentitySourceMap } from '../sourceMap'

export function writeEvent(basePath, event) {
  var { fileType } = event
  var projectFile = path.basename(event.path)
  var { projectPath } = event
  var outputPath = path.join(basePath, projectPath)

  if (event.type === 'remove') {
    return unlink(outputPath).then(() => {
      return event.supportsSourceMap ? unlink(outputPath + '.map').then(() => event) : event
    })
  }

  var outputDir = path.dirname(outputPath)

  var promise = ensureDir(path.dirname(outputPath)).then(() => {
    return writeFile(outputPath, event.data)
  })

  // TODO: attach this in glob plugin
  if (! event.sourceMap && event.supportsSourceMap) {
    event.sourceMap = generateIdentitySourceMap(event.fileType, event.path, event.data)
  }

  if (event.sourceMap) {
    var mapPath = projectFile + '.map'
    var suffix
    if (fileType === 'js')
      suffix = '//# sourceMappingURL=' + mapPath
    else if (fileType === 'css')
      suffix = '/*# sourceMappingURL=' + mapPath + ' */'

    if (suffix)
      event.data += '\n' + suffix

    promise = promise.then(() => {
      var { sourceMap } = event
      sourceMap.sources = sourceMap.sources.map(source => path.relative(outputDir, source))
      return writeFile(path.join(outputDir, mapPath), JSON.stringify(sourceMap))
    })
  }

  return promise.then(() => event)
}

// basePath = base directory in which to write output files
export default function(stream, basePath) {
  return mapEvents(stream, writeEvent.bind(this, basePath))
}
