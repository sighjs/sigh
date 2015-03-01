import chokidar from 'chokidar'
import glob from 'glob'
import _ from 'lodash'
var { Bacon } = require('baconjs'); // traceur :(

import Event from './event'

var DEFAULT_DEBOUNCE = 500

function bufferingDebounce(stream, delay) {
  // I feel like there's a better way to do this...
  var buffer = []
  return stream.flatMapLatest(value => {
    buffer.push(value)
    return Bacon.later(delay, buffer)
  })
  .map(buffer => {
    var copy = buffer.slice(0)
    buffer.length = 0
    return copy
  })
}

export default function(stream, opts, ...patterns) {
  if (stream !== null)
    throw Error('glob must be the first operation in a pipeline')

  var newEvent = props => {
    if (opts.baseDir)
      props.baseDir = opts.baseDir
    return new Event(props)
  }

  stream = Bacon.combineAsArray(
    patterns.map(
      pattern => Bacon.fromNodeCallback(
        glob,
        opts.baseDir ? opts.baseDir + '/' + pattern : pattern
      )
    )
  )
  .map(_.flatten)
  .map(files => files.map(file => newEvent({ type: 'add', path: file })))
  .take(1)

  if (! opts.watch)
    return stream

  var watcher = chokidar.watch(patterns, { ignoreInitial: true })

  var updates = Bacon.mergeAll(
    Bacon.fromEvent(watcher, 'add').map(path => newEvent({ type: 'add', path })),
    Bacon.fromEvent(watcher, 'change').map(path => newEvent({ type: 'change', path }))
  )
  return stream.changes().concat(bufferingDebounce(updates, opts.debounce || DEFAULT_DEBOUNCE))
}
