import Promise from 'bluebird'
import { Bacon } from 'sigh-core'
import _ from 'lodash'

import { bufferingDebounce } from 'sigh-core/lib/stream'

export default function(op, ...pipelines) {
  let collectInitial = false
  if (pipelines.length && ! pipelines[0].plugin) {
    const opts = pipelines.shift()
    collectInitial = opts.collectInitial
  }

  // Promise.map(..., { concurrency: 1 }) delivers the items to the iterator
  // out of order which messes with opTreeIndex ordering.
  const streamPromise = Promise.reduce(
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

  if (collectInitial) {
    return streamPromise.then(stream => {
      let { length: nStreamEventsLeft } = pipelines
      return stream.flatMapLatest(events => {
        if (events.every(event => event.initPhase)) {
          if (! --nStreamEventsLeft)
            return Bacon.mergeAll([ Bacon.constant(events), stream ])
        }

        return Bacon.never()
      })
    })
  }

  return streamPromise
}
