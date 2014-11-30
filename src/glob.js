import Promise from 'bluebird'
import _ from 'lodash'
import _glob from 'glob'

var glob = Promise.promisify(_glob)

function build(operation, patterns) {
  console.log("glob build: => %j", patterns, operation.inputs)
  return Promise
    .all(patterns.map(pattern => glob(pattern)))
    .then(_.flatten)
    .map(filePath => operation.makeResource(filePath))
}

function watch(operation, patterns) {
  // TODO: register glob watches and call operation.next when they fire
  return []
}

export default function(...patterns) {
  return operation => {
    operation.enforceSource()
    return build(operation, patterns).then(resources => {
      if (operation.forWatch)
        watch(operation, patterns)
      return resources
    })
  }
}
