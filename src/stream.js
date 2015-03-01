import Promise from 'bluebird'

/**
 * Adapt the events in a stream by running callback on each event in a new value.
 * @param {Function} callback To adapt event, can also return a promise to delay the stream.
 * @return {Bacon} stream that will pass the adapted events.
 */
export function mapEvents(stream, callback) {
  return stream.flatMap(events => Promise.all(events.map(callback)))
}
