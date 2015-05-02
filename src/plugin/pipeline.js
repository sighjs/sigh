import Promise from 'bluebird'
import { Bacon } from 'sigh-core'
import _ from 'lodash'

import { bufferingDebounce } from '../stream'

var DEFAULT_DEBOUNCE = 200

export default function(op, ...pipelineNames) {
  var { compiler } = op

  pipelineNames = pipelineNames.filter(p => ! p.hasOwnProperty('activate'))

  if (op.stream !== compiler.initStream) {
    pipelineNames.forEach(name => {
      // TODO: avoid forwarding []?
      compiler.addPipelineInput(name, op.stream.skipErrors())
    })
  }

  // during this call the streams may not be set up, wait until the first
  // "stream initialisation" value before merging the pipeline streams.
  return op.stream.take(1).flatMap(events => {
    return Bacon.mergeAll(_.reduce(
      pipelineNames,
      (streams, name) => {
        var stream = compiler.streams[name]
        if (stream)
          streams.push(stream)
        return streams
      },
      []
    )).skipErrors()
  })
}
