import { pipelineToOperation } from './pipeline'
import _ from 'lodash'

/// @param latestResources Array of resources from each child operation in order
function watch(latestResources, operation, childOps) {
  childOps.forEach((childOp, childIdx) => {
    childOp.append({
      execute(inputs) {
        latestResources[childIdx] = inputs
        var nextOn = _.flatten(latestResources)
        operation.next(_.flatten(latestResources))
      }
    })
  })
}

export default function(...pipelines) {
  var childOps = pipelines.map(pipeline => {
    if (! (pipeline instanceof Array))
      pipeline = [ pipeline ]

    return pipelineToOperation(pipeline)
  })

  return operation => {
    var latestResources = []

    return Promise.all(
      _.map(childOps, childOp => childOp.execute(operation.inputs))
    )
    .then(resources => {
      latestResources = resources
      return _.flatten(resources)
    })
    .then(resources => {
      console.log("all: %j => %j", operation.inputs, resources)

      // TODO: embed a dummy operation at the end of each child operation
      //       that will intercept next() events to propogate them forward
      //       down the tree

      if (operation.forWatch)
        watch(latestResources, operation, childOps)

      return resources
    })
  }
}
