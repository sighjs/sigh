import Promise from 'bluebird'
import Bacon from 'baconjs'

/**
 * Adapt the events in a stream by running callback on each event in a new value.
 * @return {Bacon} stream that will pass the adapted events.
 * @param {Function} callback To adapt event, can also return a promise to delay the stream.
 */
export function mapEvents(stream, callback) {
  return stream.flatMapConcat(events => Bacon.fromPromise(Promise.all(events.map(callback))))
}

/**
 * Like traditional debounce but buffer all values together and pass them along the
 * stream as an array.
 * @param {Bacon} stream debounce this stream.
 * @param {Number} delay debounce delay in milliseconds
 */
export function bufferingDebounce(stream, delay) {
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

/**
 * Adapt a stream to forward the current state of the output tree as an object instead of events needed to modify that file. The object is of the form: { relativePath, event } where event is the most recent change/add event to happen to that path.
 * @param {Bacon} stream Stream to coalesce.
 */
export function coalesceEvents(stream) {
  var eventCache = {} // event by relative path

  return stream.map(events => {
    events.forEach(event => {
      switch (event.type) {
        case 'remove':
          delete eventCache[event.projectPath]
          break;
        case 'change':
          eventCache[event.projectPath] = event
          break;
        case 'add':
          eventCache[event.projectPath] = event
          break
        default:
          throw Error(`Bad event type ${event.type}`)
      }
    })
    return eventCache
  })
}
