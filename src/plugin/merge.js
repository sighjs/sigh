import Promise from 'bluebird'
import Bacon from 'baconjs'
import _ from 'lodash'

import { bufferingDebounce } from '../stream'

var DEFAULT_DEBOUNCE = 200

export default function(op, ...pipelines) {
  // Promise.map(..., { concurrency: 1 }) delivers the items to the iterator
  // out of order which messes with opTreeIndex ordering.
  return Promise.reduce(
    pipelines,
    (streams, pipeline) => {
      return op.compiler.compile(pipeline, op.stream || null)
      .then(stream => {
        streams.push(stream)
        return streams
      })
    },
    []
  )
  .then(streams => Bacon.mergeAll(streams.filter(stream => stream !== op.compiler.initStream)))
  // env may pass on null when the input stream is null... those are filtered
  // out above
}
