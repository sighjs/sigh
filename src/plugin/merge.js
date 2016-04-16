import Promise from 'bluebird'
import { Bacon } from 'sigh-core'
import _ from 'lodash'

import { bufferingDebounce } from 'sigh-core/lib/stream'

export default function(op, ...pipelines) {
  let collectInitials = false
  if (! pipelines.stream) {
    const opts = pipelines.unshift()
    collectInitials = opts.collectInitials
  }

  // Promise.map(..., { concurrency: 1 }) delivers the items to the iterator
  // out of order which messes with opTreeIndex ordering.
  const stream = Promise.reduce(
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

  if (collectInitials) {
    let { length: nStreamEventsLeft } = pipelines

    return stream.flatMapLatest(events => {
      if (events.every(event => event.initPhase)) {
        return --nStreamEventsLeft ? Bacon.never() :
                                     Bacon.mergeAll([ Bacon.constant(events), stream ])
      }
    })
  }

  return stream
}
