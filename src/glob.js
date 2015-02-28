import chokidar from 'chokidar'
import glob from 'glob'
import _ from 'lodash'
var { Bacon } = require('baconjs'); // traceur :(

export default function(stream, watch, ...patterns) {
  if (stream !== null) {
    throw Error('glob must be the first operation in a pipeline')
  }

  stream = Bacon.combineAsArray(
    patterns.map(pattern => Bacon.fromNodeCallback(glob, pattern))
  )
  .map(_.flatten)
  .map(files => files.map(file => ({ type: 'add', path: file })))
  .take(1)

  if (! watch)
    return stream

  var watcher = chokidar.watch(patterns, { ignoreInitial: true })

  // TODO: debounce + buffer into array
  var updates = Bacon.mergeAll(
    Bacon.fromEvent(watcher, 'add').map(path => ({ type: 'add', path })),
    Bacon.fromEvent(watcher, 'change').map(path => ({ type: 'change', path }))
  )

  return stream.changes().concat(updates)
}
