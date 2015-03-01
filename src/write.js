import traceur from 'traceur'
import path from 'path'
import Promise from 'bluebird'
import esprima from 'esprima'
var { Bacon } = require('baconjs')
var { SourceMapGenerator, SourceMapConsumer }  = require('source-map')

var writeFile = Promise.promisify(require('fs').writeFile)
var ensureDir = Promise.promisify(require('fs-extra').ensureDir)

function generateIdentitySourceMap(sourcePath, data) {
  var generator = new SourceMapGenerator({ file: path.basename(sourcePath) })
  var tokens = esprima.tokenize(data, { loc: true })
  tokens.forEach(function(token) {
    var loc = token.loc.start
    generator.addMapping({ generated: loc, original: loc, source: sourcePath })
  })
  return JSON.stringify(generator.toJSON())
}

function rebaseSourcePaths(map) {
  // TODO:
  return map
}

export function writeEvent(outputDir, event) {
  if (event.type === 'remove') {
    // TODO: remove path
    return event
  }

  var outputPath = path.join(outputDir, event.path)

  var promise = ensureDir(path.dirname(outputPath)).then(() => {
    return writeFile(outputPath, event.data)
  })

  var { fileType } = event
  if (fileType === 'js' && ! event.map) {
    event.map = generateIdentitySourceMap(event.path, event.data)
  }

  if (event.map) {
    var mapPath = event.path + '.map'
    var suffix
    if (fileType === 'js')
      suffix = '//# sourceMappingURL=' + mapPath
    else if (fileType === 'css')
      suffix = '/*# sourceMappingURL=' + mapPath + ' */'

    if (suffix)
      event.data += '\n' + suffix

    promise = promise.then(() => {
      var map = rebaseSourcePaths(event.map)
      return writeFile(path.join(outputDir, mapPath), map)
    })
  }

  return promise.then(() => event)
}

export default function(stream, outputDir) {
  return stream.flatMap(events => Promise.all(events.map(writeEvent.bind(this, outputDir))))
}
