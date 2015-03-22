import _ from 'lodash'
import { toFileSystemState } from '../stream'
import { concatenate as concatSourceMaps } from '../sourceMap'
import Event from '../Event'

export default function(op, outputPath) {
  var fileExists = false

  return toFileSystemState(op.stream)
  .map(function(eventCache) {
    var data = '', sourceMaps = []
    var offsets = [0], cumOffset = 0
    var events = _.sortBy(eventCache, 'opTreeIndex')
    events.forEach((event, idx) => {
      var offset = event.lineCount - 1
      data += event.data
      if (data[data.length - 1] !== '\n') {
        data += '\n'
        ++offset
      }
      sourceMaps.push(event.sourceMap)

      if (idx < events.length - 1)
        offsets.push(cumOffset += offset)
    })

    var sourceMap = concatSourceMaps(sourceMaps, offsets)
    sourceMap.file = outputPath

    var ret = [ new Event({
      type: fileExists ? 'change' : 'add', path: outputPath, data, sourceMap
    }) ]
    fileExists = true
    return ret
  })
}
