import { pipelineToOperation } from './pipeline'
import _ from 'lodash'

export default function(...pipelines) {

  var childOps = pipelines.map(pipeline => {
    if (! (pipeline instanceof Array))
      pipeline = [ pipeline ]

    return pipelineToOperation(pipeline)
  })

  return operation => {
    return Promise.all(
      _.map(childOps, childOp => childOp.execute(operation.inputs))
    )
    .then(_.flatten)
    .then(resources => {
      console.log("all: %j => %j", operation.inputs, resources)

      // TODO: embed a dummy operation at the end of each child operation
      //       that will intercept next() events to propogate them forward
      //       down the tree

      return resources
    })
  }
}
