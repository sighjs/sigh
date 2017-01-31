import _ from 'lodash'
import { toFileSystemState } from 'sigh-core/lib/stream'
import { concatenate as concatSourceMaps } from 'sigh-core/lib/sourceMap'
import { log, Event } from 'sigh-core'

export default function(op, outputPath) {
  let fileExists = false
  let maxCreateTime = new Date(-8640000000000000)

  return toFileSystemState(op.stream)
  .map(function(eventCache) {
    let data = ''
    const sourceMaps = []
    const offsets = [0]
    let cumOffset = 0
    const events = _.sortBy(eventCache, 'opTreeIndex')

    // set this to the earliest new createTime after maxCreateTime
    let createTime = null
    let nextMaxCreateTime = maxCreateTime

    events.forEach((event, idx) => {
      if (event.createTime > maxCreateTime) {
        if (event.createTime < createTime || createTime === null)
          createTime = event.createTime

        if (event.createTime > nextMaxCreateTime)
          nextMaxCreateTime = event.createTime
      }

      let offset = event.lineCount - 1
      data += event.data
      if (data[data.length - 1] !== '\n') {
        data += '\n'
        ++offset
      }

      let sourceMap
      try {
        sourceMap = event.sourceMap
      }
      catch (e) {
        log.warn('\x07could not construct identity source map for %s', event.projectPath)
        if (e.message)
          log.warn(e.message)
      }

      if (sourceMap) {
        sourceMaps.push(sourceMap)
      }

      if (idx < events.length - 1)
        offsets.push(cumOffset += offset)
    })

    // is null when none of the creation times was greater than the previous
    if (createTime === null)
      createTime = maxCreateTime

    maxCreateTime = nextMaxCreateTime

    const sourceMap = concatSourceMaps(sourceMaps, offsets)
    sourceMap.file = outputPath

    const ret = [ new Event({
      type: fileExists ? 'change' : 'add',
      path: outputPath,
      data,
      sourceMap,
      createTime,
      initPhase: ! events.some(event => ! event.initPhase)
    }) ]
    fileExists = true
    return ret
  })
}
