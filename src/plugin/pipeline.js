import Promise from 'bluebird'
import Bacon from 'baconjs'
import _ from 'lodash'

import { bufferingDebounce } from '../stream'

var DEFAULT_DEBOUNCE = 200

export default function(op, ...pipelineNames) {
  if (op.stream != op.compiler.initStream) {
    // when `pipeline` is not the first item in a stream then forward input events
    op.stream.onValue(events => {
      if (events.length === 0)
        return

      // TODO: ...
    })
  }

  // during this call the streams may not be set up, wait until the first
  // "stream initialisation" value before merging the pipeline streams.
  return op.stream.take(1).flatMap(events => {
    return Bacon.mergeAll(pipelineNames.map(name => op.compiler.streams[name]))
  })
}

