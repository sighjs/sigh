import Promise from 'bluebird'
var { Bacon } = require('baconjs')

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
