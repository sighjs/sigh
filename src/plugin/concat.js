import _ from 'lodash'
import { toFileSystemState } from '../stream'
import { concatenate as concatSourceMaps } from '../sourceMap'
import Event from '../Event'

export default function(op, outputPath) {
  var fileExists = false
  var createTime = new Date

  return toFileSystemState(op.stream)
  .map(function(eventCache) {
    var data = '', sourceMaps = []
    var offsets = [0], cumOffset = 0
    var events = _.sortBy(eventCache, 'opTreeIndex')
    var nextCreateTime = new Date(8640000000000000)

    events.forEach((event, idx) => {
      // set createTime to next lowest create time later than previous lowerst create time
      if (event.createTime > createTime && event.createTime < nextCreateTime)
        nextCreateTime = event.createTime

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

    createTime = nextCreateTime

    var sourceMap = concatSourceMaps(sourceMaps, offsets)
    sourceMap.file = outputPath

    // TODO: set createTime as minimum time since previous event
    var ret = [ new Event({
      type: fileExists ? 'change' : 'add',
      path: outputPath,
      data,
      sourceMap,
      createTime
    }) ]
    fileExists = true
    return ret
  })
}
