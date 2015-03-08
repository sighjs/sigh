import chokidar from 'chokidar'
import _ from 'lodash'
import Bacon from 'baconjs'
import Promise from 'bluebird'
var glob = Promise.promisify(require('glob'))

import Event from '../event'
import { bufferingDebounce } from '../stream'

var DEFAULT_DEBOUNCE = 200

export default function(op, ...patterns) {
  var { stream } = op
  if (stream)
    throw Error('glob must be the first operation in a pipeline')

  // the first argument could be an option object rather than a pattern
  var opts = typeof patterns[0] === 'object' ? patterns.shift() : {}

  var { treeIndex = 1 } = op
  op.nextTreeIndex = treeIndex + patterns.length

  var newEvent = (type, { path, treeIndex }) => {
    var props = { type, path, opTreeIndex: treeIndex }
    if (opts.basePath)
      props.basePath = opts.basePath
    return new Event(props)
  }

  stream = Bacon.combineAsArray(
    patterns.map(
      (pattern, idx) => Bacon.fromPromise(
        glob(opts.basePath ? opts.basePath + '/' + pattern : pattern).then(
          paths => paths.map(path => ({ path, treeIndex: treeIndex + idx }))
        )
      )
    )
  )
  .map(_.flatten)
  .map(files => files.map(newEvent.bind(this, 'add')))
  .take(1)

  if (! op.watch)
    return stream

  var watchers = patterns.map(
    pattern => chokidar.watch(pattern, { ignoreInitial: true })
  )

  var updates = Bacon.mergeAll(
    _.flatten(['add', 'change', 'remove'].map(type =>
      watchers.map(
        (watcher, idx) => Bacon.fromEvent(watcher, type).map(
          path => newEvent(type, { path, treeIndex: treeIndex + idx })
        )
      )
    ))
  )

  return stream.changes().concat(bufferingDebounce(updates, opts.debounce || DEFAULT_DEBOUNCE))
}
