import chokidar from 'chokidar'
import _ from 'lodash'
import { Bacon, Event } from 'sigh-core'
import Promise from 'bluebird'
const glob = Promise.promisify(require('glob'))

import { bufferingDebounce, coalesceEvents } from 'sigh-core/lib/stream'

// necessary to detect chokidar's duplicate/invalid events, see later comment
const DEFAULT_DEBOUNCE = 120

export default function(op, ...patterns) {
  // the first argument could be an option object rather than a pattern
  const opts = typeof patterns[0] === 'object' ? patterns.shift() : {}

  const { treeIndex = 1, debounce = DEFAULT_DEBOUNCE } = op
  op.nextTreeIndex = treeIndex + patterns.length

  const newEvent = (type, { path, treeIndex, initPhase = false }) => {
    const props = { type, path, initPhase, opTreeIndex: treeIndex, encoding: opts.encoding }
    if (opts.basePath)
      props.basePath = opts.basePath
    props.createTime = new Date
    return new Event(props)
  }

  if (opts.basePath)
    patterns = patterns.map(pattern => opts.basePath + '/' + pattern)

  const makeGlobStream = events => {
    const stream = Bacon.combineAsArray(
      patterns.map(
        (pattern, idx) => Bacon.fromPromise(
          glob(pattern).then(
            paths => paths.map(path => ({ path, treeIndex: treeIndex + idx }))
          )
        )
      )
    )
    .map(_.flatten)
    .map(files => {
      return events.concat(files.map(file => {
        file.initPhase = true
        return newEvent('add', file)
      }))
    })
    .take(1)

    if (! op.watch)
      return stream

    const watchers = patterns.map(
      pattern => chokidar.watch(pattern, { ignoreInitial: true })
    )

    const chokEvRemap = { unlink: 'remove' }
    const updates = Bacon.mergeAll(
      _.flatten(['add', 'change', 'unlink'].map(type => watchers.map(
        (watcher, idx) => Bacon.fromEvent(watcher, type).map(
          path => {
            // TODO: remove
            // console.log('watch', Date.now(), type, path)
            return [ newEvent(chokEvRemap[type] || type, { path, treeIndex: treeIndex + idx }) ]
          }
        )
      )))
    )

    // see https://github.com/paulmillr/chokidar/issues/262
    // the debounce alone makes chokidar behave but eventually coalesceEvents will
    // act as a second defense to this issue.
    return stream.changes().concat(
      coalesceEvents( bufferingDebounce(updates, debounce).map(_.flatten) )
    )
  }

  let globStream
  return op.stream.flatMap(events => {
    if (! globStream) {
      globStream = makeGlobStream(events)
      return globStream
    }
    else {
      return events
    }
  })
}
