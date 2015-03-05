import chokidar from 'chokidar'
import glob from 'glob'
import _ from 'lodash'
import Bacon from 'baconjs'

import Event from '../event'
import { bufferingDebounce } from '../stream'

var DEFAULT_DEBOUNCE = 500

export default function(op, ...patterns) {
  var { stream } = op
  if (stream)
    throw Error('glob must be the first operation in a pipeline')

  // the first pattern could be an option object
  var opts = typeof patterns[0] === 'object' ? patterns.shift() : {}

  var newEvent = props => {
    if (opts.basePath)
      props.basePath = opts.basePath
    return new Event(props)
  }

  stream = Bacon.combineAsArray(
    patterns.map(
      pattern => Bacon.fromNodeCallback(
        glob,
        opts.basePath ? opts.basePath + '/' + pattern : pattern
      )
    )
  )
  .map(_.flatten)
  .map(files => files.map(file => newEvent({ type: 'add', path: file })))
  .take(1)

  if (! op.watch)
    return stream

  var watcher = chokidar.watch(patterns, { ignoreInitial: true })

  var updates = Bacon.mergeAll(
    Bacon.fromEvent(watcher, 'add').map(path => newEvent({ type: 'add', path })),
    Bacon.fromEvent(watcher, 'change').map(path => newEvent({ type: 'change', path }))
  )
  return stream.changes().concat(bufferingDebounce(updates, opts.debounce || DEFAULT_DEBOUNCE))
}
