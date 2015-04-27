import Promise from 'bluebird'
import Bacon from 'baconjs'
import _ from 'lodash'

import { bufferingDebounce } from '../stream'

var DEFAULT_DEBOUNCE = 200

export default function(op, ...pipelineNames) {
  if (op.stream !== op.compiler.initStream) {
    // TODO: record dependency between streams
  }

  // during this call the streams may not be set up, wait until the first
  // "stream initialisation" value before merging the pipeline streams.
  return op.stream.take(1).flatMap(events => {
    return Bacon.mergeAll(_.reduce(
      pipelineNames,
      (streams, name) => {
        var stream = op.compiler.streams[name]
        if (stream)
          streams.push(stream)
        return streams
      },
      []
    ))
  })
}

