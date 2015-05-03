import Vinyl from 'vinyl'
import { Bacon } from 'sigh-core'
import { Transform } from 'stream'

import Event from './Event'

export default gulpPlugin => adapter.bind(null, gulpPlugin)

function adapter(gulpPlugin, op, ...args) {
  var gulpInStream = new Transform({ objectMode: true })
  var gulpOutStream = gulpInStream.pipe(gulpPlugin(...args))

  var gulpAdaptedStream = Bacon.fromEvent(gulpOutStream, 'data').map(vinyl => {
    var { __source: source } = vinyl
    if (! source)
      return new Bacon.Error('gulp plugin lost source, may not be compatible with sigh')

    source.data = vinyl.contents.toString()
    source.sourceMap = vinyl.sourceMap

    return [ source ]
  })

  var passThroughStream = op.stream.flatMap(events => {
    var passThroughEvents = []
    events = events.filter(event => {
      if (event.type === 'change' || event.type === 'add')
        return true
      passThroughEvents.push(event)
      return false
    })

    if (events.length !== 0) {
      events.forEach(event => {
        var vinyl = new Vinyl({
          contents: new Buffer(event.data),
          path: event.projectPath,
          base: event.basePath,
        })

        // the next cannot be attached via the constructor
        vinyl.sourceMap = event.sourceMap

        // something to help...
        vinyl.__source = event
        gulpInStream.push(vinyl)
      })
    }

    return passThroughEvents.length === 0 ? Bacon.never() : passThroughEvents
  })

  // var terminateStream = op.stream.take(1).map(() => { op.stream.onEnd() })

  // TODO: close gulpAdaptedStream on end of input stream
  return Bacon.mergeAll(gulpAdaptedStream, passThroughStream)
}
