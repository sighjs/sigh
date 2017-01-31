import _ from 'lodash'

import { Bacon } from 'sigh-core'
import { bufferingDebounce } from 'sigh-core/lib/stream'

export default function(op, delay = 500) {
  // return bufferingDebounce(op.stream, delay).map(_.flatten)

  let initPhase = true
  const buffer = []
  return op.stream.flatMapLatest(events => {
    // avoid buffering during file watch phase
    if (! initPhase)
      return events

    if (events.some(event => ! event.initPhase)) {
      // glob found end of init phase
      initPhase = false
      if (buffer.length) {
        events = buffer.concat(events)
        buffer.length = 0
      }
      return events
    }

    // TODO: coalesce events to reflect latest fs state
    buffer.push(...events)

    // if another event is published then flatMapLatest unsubscribes from
    // the stream returned previously ensuring the splice doesn't happen.
    return Bacon.later(delay, buffer).map(buffer => buffer.splice(0))
  })

}
