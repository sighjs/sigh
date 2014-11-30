import { pipelineToOperation } from './pipeline'

export default function(...pipelines) {

  var childOps = pipelines.map(pipeline => {
    if (! (pipeline instanceof Array))
      pipeline = [ pipeline ]

    return pipelineToOperation(pipeline)
  })

  return operation => {
    console.log("all: => %j", operation.inputs)
    return []
  }
}
