import Vinyl from 'vinyl'
import { Bacon, Event } from 'sigh-core'
import { Transform } from 'stream'

export default gulpPlugin => adapter.bind(null, gulpPlugin)

function adapter(gulpPlugin, op, ...args) {
  let sink
  const gulpAdaptedStream = Bacon.fromBinder(_sink => { sink = _sink })

  const onGulpValue = vinyl => {
    const { __source: source } = vinyl
    if (! source)
      return new Bacon.Error('gulp plugin lost source, may not be compatible with sigh')

    source.data = vinyl.contents.toString()
    source.sourceMap = vinyl.sourceMap

    sink([ source ])
  }

  const gulpInStream = new Transform({ objectMode: true })
  const gulpOutStream = gulpInStream.pipe(gulpPlugin(...args))
  gulpOutStream.on('data', onGulpValue)

  let registeredForEnd = false

  const passThroughStream = op.stream.flatMap(events => {
    const passThroughEvents = []
    events = events.filter(event => {
      if (event.type === 'change' || event.type === 'add')
        return true
      passThroughEvents.push(event)
      return false
    })

    if (events.length !== 0) {
      events.forEach(event => {
        const vinyl = new Vinyl({
          contents: new Buffer(event.data),
          path: event.path,
          // the following messes with source maps...
          // path: event.projectPath,
          // base: event.basePath,
        })

        // the next cannot be attached via the constructor
        vinyl.sourceMap = event.sourceMap

        // something to help...
        vinyl.__source = event
        gulpInStream.push(vinyl)
      })
    }

    if (! registeredForEnd) {
      // delay until the first value to avoid starting stream during compilation stage
      op.stream.onEnd(() => {
        // without the nextTick then the last event can go missing on node 0.10
        process.nextTick(() => {
          gulpOutStream.removeListener('data', onGulpValue)
          sink(new Bacon.End())
        })
      })
      registeredForEnd = true
    }

    return passThroughEvents.length === 0 ? Bacon.never() : passThroughEvents
  })

  return Bacon.mergeAll(gulpAdaptedStream, passThroughStream)
}
