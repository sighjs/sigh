import Promise from 'bluebird'
import Bacon from 'baconjs'
import _ from 'lodash'

import { bufferingDebounce } from '../stream'

var DEFAULT_DEBOUNCE = 200

export default function(op, ...pipelineNames) {
  op.stream.onValue(events => {
    if (events.length === 0)
      return

    // TODO: forward events to named pipelines
  })

  // wait until the first value to construct the merged stream, they may not
  // be available during this call.
  return op.stream.take(1).flatMap(events => {
    return Bacon.mergeAll(pipelineNames.map(name => op.compiler.streams[name]))
  })
}

