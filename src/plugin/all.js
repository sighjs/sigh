import Promise from 'bluebird'
import Bacon from 'baconjs'
import _ from 'lodash'

import { bufferingDebounce } from '../stream'

var DEFAULT_DEBOUNCE = 200

export default function(op, ...pipelines) {
  // probably not the best way to detect option argument...
  var opts = _.assign(
    { debounce: DEFAULT_DEBOUNCE }, pipelines[0].debounce ? pipelines.shift() : {}
  )

  return Promise.map(
    pipelines,
    pipeline => op.compiler.compile(pipeline, op.stream || null),
    { concurrency: 1 } // to ensure treeIndex ordering
  )
  .then(streams => {
    var combined = bufferingDebounce(Bacon.mergeAll(streams), opts.debounce).map(_.flatten)
    return op.stream ? op.stream.map(combined) : combined
  })
}
