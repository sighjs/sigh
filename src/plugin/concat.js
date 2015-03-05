import _ from 'lodash'
import { coalesceEvents } from '../stream'
import { concatenate as concatSourceMaps } from '../sourceMap'
import Event from '../event'

export default function(stream, outputPath, debounceDelay) {
  var fileExists = false

  return coalesceEvents(stream)
  .debounce(debounceDelay || 500)
  .map(function(eventCache) {
    var data = '', sourceMaps = []
    _.forEach(eventCache, event => {
      data += event.data
      // TODO: strip source map comment

      if (data[data.length - 1] !== '\n')
        data += '\n'
      sourceMaps.push(event.sourceMap)
    })

    var ret = [ new Event({
      type: fileExists ? 'change' : 'add',
      path: outputPath,
      data,
      sourceMap: concatSourceMaps(sourceMaps)
    }) ]
    fileExists = true
    return ret
  })
}
