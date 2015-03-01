import Promise from 'bluebird'
var { Bacon } = require('baconjs')

/**
 * Adapt the events in a stream by running callback on each event in a new value.
 * @param {Function} callback To adapt event, can also return a promise to delay the stream.
 * @return {Bacon} stream that will pass the adapted events.
 */
export function mapEvents(stream, callback) {
  return stream.flatMapConcat(events => Bacon.fromPromise(Promise.all(events.map(callback))))
}
