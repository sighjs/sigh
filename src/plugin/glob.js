import chokidar from 'chokidar'
import _ from 'lodash'
import Bacon from 'baconjs'
import Promise from 'bluebird'
var glob = Promise.promisify(require('glob'))

import Event from '../Event'

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

  if (opts.basePath)
    patterns = patterns.map(pattern => opts.basePath + '/' + pattern)

  stream = Bacon.combineAsArray(
    patterns.map(
      (pattern, idx) => Bacon.fromPromise(
        glob(pattern).then(
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

  var chokEvRemap = { unlink: 'remove' }
  var updates = Bacon.mergeAll(
    _.flatten(['add', 'change', 'unlink'].map(type =>
      watchers.map(
        (watcher, idx) => Bacon.fromEvent(watcher, type).map(
          path => [ newEvent(chokEvRemap[type] || type, { path, treeIndex: treeIndex + idx }) ]
        )
      )
    ))
  )

  return stream.changes().concat(updates)
}
