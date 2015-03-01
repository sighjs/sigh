import traceur from 'traceur'
import path from 'path'
import Promise from 'bluebird'
import esprima from 'esprima'
var { SourceMapGenerator }  = require('source-map')
import fs from 'fs'
var writeFile = Promise.promisify(fs.writeFile)
var unlink = Promise.promisify(fs.unlink)
var ensureDir = Promise.promisify(require('fs-extra').ensureDir)

import { mapEvents } from './stream'

function generateIdentitySourceMap(sourceType, sourcePath, data) {
  if (sourceType === 'js') {
    var generator = new SourceMapGenerator({ file: path.basename(sourcePath) })
    var tokens = esprima.tokenize(data, { loc: true })
    tokens.forEach(function(token) {
      var loc = token.loc.start
      generator.addMapping({ generated: loc, original: loc, source: sourcePath })
    })
    return generator.toJSON()
  }
  else if (sourceType === 'css') {
    // TODO:
    return {}
  }
}

export function writeEvent(baseDir, event) {
  // TODO: strip basedirs off of head of event.path when determining projectPath
  var { fileType } = event
  var projectFile = path.basename(event.path)
  var projectPath = event.path
  var outputPath = path.join(baseDir, projectPath)

  if (event.type === 'remove') {
    return unlink(outputPath).then(() => {
      return event.supportsSourceMap ?  unlink(outputPath + '.map').then(() => event) : event
    })
  }

  var outputDir = path.dirname(outputPath)

  var promise = ensureDir(path.dirname(outputPath)).then(() => {
    return writeFile(outputPath, event.data)
  })

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

// baseDir = base directory in which to write output files
export default function(stream, baseDir) {
  return mapEvents(stream, writeEvent.bind(this, baseDir))
}
