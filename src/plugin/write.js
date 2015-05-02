import path from 'path'
import Promise from 'bluebird'
import fs from 'fs'

import fse from 'fs-extra'
var rm = Promise.promisify(fse.remove) // TODO: not used yet, see later comment
var writeFile = Promise.promisify(fs.writeFile)
var unlink = Promise.promisify(fs.unlink)
var ensureDir = Promise.promisify(fse.ensureDir)

import { mapEvents } from 'sigh-core/lib/stream'

export function writeEvent(basePath, event) {
  var { fileType } = event
  var projectFile = path.basename(event.path)
  var { projectPath } = event
  var outputPath = path.join(basePath, projectPath)

  // amend object passed out of pipeline to reflect written file
  delete event.basePath
  event.path = outputPath

  if (event.type === 'remove') {
    return unlink(outputPath).then(() => {
      return event.supportsSourceMap ? unlink(outputPath + '.map').then(() => event) : event
    })
  }

  var outputDir = path.dirname(outputPath)

  var promise = ensureDir(path.dirname(outputPath)).then(() => {
    return writeFile(outputPath, event.data)
  })

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
export default function(op, basePath) {
  // sanitize a path we are about to recursively remove... it must be below
  // the current working directory (which contains Sigh.js)
  if (! basePath || basePath[0] === '/' || basePath.substr(0, 3) === '../')
    throw Error(`bad basePath '${basePath}'`)

  // TODO: do it with a promise
  fse.removeSync(basePath)

  return mapEvents(op.stream, writeEvent.bind(this, basePath))
}
