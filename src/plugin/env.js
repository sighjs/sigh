import _ from 'lodash'

export default function(op, pipeline, ...envs) {
  envs = _.flatten(envs)
  if (! _.includes(envs, op.environment))
    return op.stream

  return op.compiler.compile(pipeline, op.stream)
}
