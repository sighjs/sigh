import _ from 'lodash'
import { toFileSystemState } from 'sigh-core/lib/stream'
import { concatenate as concatSourceMaps } from 'sigh-core/lib/sourceMap'
import Event from '../Event'

export default function(op, outputPath) {
  var fileExists = false
  var maxCreateTime = new Date(-8640000000000000)

  return toFileSystemState(op.stream)
  .map(function(eventCache) {
    var data = '', sourceMaps = []
    var offsets = [0], cumOffset = 0
    var events = _.sortBy(eventCache, 'opTreeIndex')

    // set this to the earliest new createTime after maxCreateTime
    var createTime = null
    var nextMaxCreateTime = maxCreateTime

    events.forEach((event, idx) => {
      if (event.createTime > maxCreateTime) {
        if (event.createTime < createTime || createTime === null)
          createTime = event.createTime

        if (event.createTime > nextMaxCreateTime)
          nextMaxCreateTime = event.createTime
      }

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

    // is null when none of the creation times was greater than the previous
    if (createTime === null)
      createTime = maxCreateTime

    maxCreateTime = nextMaxCreateTime

    var sourceMap = concatSourceMaps(sourceMaps, offsets)
    sourceMap.file = outputPath

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
