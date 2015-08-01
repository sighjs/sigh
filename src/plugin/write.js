import path from 'path'
import Promise from 'bluebird'
import fs from 'fs'
import { log } from 'sigh-core'

import fse from 'fs-extra'

var glob = Promise.promisify(require('glob'))

var writeFile = Promise.promisify(fs.writeFile)
var unlink = Promise.promisify(fs.unlink)
var rm = Promise.promisify(fse.remove) // TODO: not used yet, see later comment
var ensureDir = Promise.promisify(fse.ensureDir)

import { mapEvents } from 'sigh-core/lib/stream'

export function writeEvent(basePath, event) {
  var { fileType } = event
  var projectFile = path.basename(event.path)
  var { projectPath } = event

  // the projectPath remains the same but the basePath is changed to point to
  // the output directory
  event.basePath = basePath

  var outputPath = event.path
  if (event.type === 'remove') {
    return unlink(outputPath).then(() => {
      return event.supportsSourceMap ? unlink(outputPath + '.map').then(() => event) : event
    })
  }

  var { data } = event
  var outputDir = path.dirname(outputPath)

  var promise = ensureDir(path.dirname(outputPath)).then(() => {
    return writeFile(outputPath, data)
  })

  if (event.supportsSourceMap) {
    var sourceMap
    try {
      sourceMap = event.sourceMap
    }
    catch (e) {
      log.warn('\x07could not construct identity source map for %s', projectPath)
      if (e.message)
        log.warn(e.message)
    }

    if (sourceMap) {
      var mapPath = projectFile + '.map'
      var suffix
      if (fileType === 'js')
        suffix = '//# sourceMappingURL=' + mapPath
      else if (fileType === 'css')
        suffix = '/*# sourceMappingURL=' + mapPath + ' */'

      if (suffix)
        data += '\n' + suffix

      promise = promise.then(() => {
        sourceMap.sources = sourceMap.sources.map(source => path.relative(outputDir, source))
        return writeFile(path.join(outputDir, mapPath), JSON.stringify(sourceMap))
      })
    }
  }

  return promise.then(() => event)
}

// basePath = base directory in which to write output files
export default function(op, options, basePath) {
  if (! basePath) {
    basePath = options
    options = {}
  }

  var clobberPromise
  var { clobber } = options
  if (clobber) {
    // sanitize a path we are about to recursively remove... it must be below
    // the current working directory (which contains sigh.js)
    if (! basePath || basePath[0] === '/' || basePath.substr(0, 3) === '../')
      throw Error(`refusing to clobber '${basePath}' outside of project`)

    if (clobber === true) {
      clobberPromise = rm(basePath)
    }
    else {
      if (! (clobber instanceof Array))
        clobber = [ clobber ]

      clobberPromise = Promise.map(clobber, pattern => {
        return glob(pattern, { cwd: basePath }).then(
          matches => Promise.map(matches, match => rm(path.join(basePath, match)))
        )
      })
    }
  }

  var streamPromise = mapEvents(op.stream, writeEvent.bind(this, basePath))
  return clobberPromise ? clobberPromise.thenReturn(streamPromise) : streamPromise
}
