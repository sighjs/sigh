import Promise from 'bluebird'
import _ from 'lodash'
import _glob from 'glob'

var glob = Promise.promisify(_glob)

var patterns

function build(operation) {
  console.log("glob build: => %j", patterns, operation.inputs)
  return Promise.all(patterns.map(pattern => glob(pattern))).then(_.flatten).map(filePath => {
    return operation.makeResource(filePath)
  })
}

function watch(operation) {
  // TODO: register glob watches and call operation.next when they fire
  return []
}

export default function(..._patterns) {
  patterns = _patterns

  return operation => {
    operation.enforceSource()
    return build(operation).then(resources => {
      if (operation.forWatch)
        watch(operation)
      return resources
    })
  }
}
