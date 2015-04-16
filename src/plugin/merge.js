import Promise from 'bluebird'
import Bacon from 'baconjs'
import _ from 'lodash'

import { bufferingDebounce } from '../stream'

var DEFAULT_DEBOUNCE = 200

export default function(op, ...pipelines) {
  return Promise.map(
    pipelines,
    pipeline => op.compiler.compile(pipeline, op.stream || null),
    { concurrency: 1 } // to ensure treeIndex ordering
  )
  .then(streams => Bacon.mergeAll(streams.filter(stream => stream !== null)))
  // env may pass on null when the input stream is null... those are filtered
  // out above
}
