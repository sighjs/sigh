import _ from 'lodash'

import Operation from './Operation'

export function pipelineToOperation(pipeline) {
  if (! (pipeline instanceof Array))
    pipeline = [ pipeline ]

  return _.reduceRight(pipeline, (nextFunc, opFunc) => {
    return new Operation(opFunc, nextFunc)
  }, new Operation(pipeline.pop()))
}
