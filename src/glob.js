import Promise from 'bluebird'
import _ from 'lodash'
import _glob from 'glob'
import gaze from 'gaze'

var glob = Promise.promisify(_glob)

function build(operation, patterns) {
  console.log("glob build: => %j", patterns, operation.inputs)
  return Promise.all(
    Promise
      .all(patterns.map(pattern => glob(pattern)))
      .then(_.flatten)
      .map(filePath => operation.resource(filePath).loadFromFs())
  )
}

function watch(operation, patterns) {
  // debounce delay doesn't seem to work
  gaze(patterns, function(err, watcher) {
    if (err) {
      console.warn('Problem establishing filesystem watch')
      return
    }

    watcher.on('all', (event, filePath) => {
      console.log(event, filePath)
      operation.resource(filePath).loadFromFs()
      operation.next() // send operation.resources() upstream
    })
  })
}

export default function(...patterns) {
  return operation => {
    operation.assertSource()
    return build(operation, patterns).then(resources => {
      if (operation.forWatch)
        watch(operation, patterns)
      return resources
    })
  }
}
