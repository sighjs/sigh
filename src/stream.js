import _ from 'lodash'
import Promise from 'bluebird'
import Bacon from 'baconjs'

/**
 * Adapt a stream to pull Bacon.Error values out of the `events` array payload and
 * push them down the stream as error events.
 */
export function liftErrors(stream) {
  return stream.flatMap(function(events) {
    // The events array may contain individual errors, the need to be passed separately
    var nonErrors = []
    var errors = events.filter(event => {
      if (event instanceof Bacon.Error)
        return true
      else
        nonErrors.push(event)
    })

    if (errors.length) {
      // send the errors individually followed by the non-errors
      errors.push(nonErrors)
      return Bacon.fromArray(errors)
    }
    else {
      return events
    }
  })
}

/**
 * Adapt the events in a stream by running callback on each event in a new
 * value.
 * @return {Bacon} stream that will pass the adapted events.
 * @param {Function} callback To adapt event, can also return a promise to
 * delay the stream.
 */
export function mapEvents(stream, callback) {
  return liftErrors(
    stream.flatMapConcat(events => Bacon.fromPromise(Promise.all(events.map(callback))))
  )
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
  .map(buffer => buffer.splice(0))
}

/**
 * Adapt a stream to forward the current state of the output tree as an array
 * of Event objects relating to the most recent event for each currently
 * existing tree path (event type will be "add" or "change").
 * @param {Bacon} stream Stream to coalesce.
 */
export function coalesceEvents(stream) {
  var eventCache = {} // event by relative path

  return stream.map(events => {
    events.forEach(event => {
      switch (event.type) {
        case 'remove':
          delete eventCache[event.projectPath]
          break
        case 'change':
          eventCache[event.projectPath] = event
          break
        case 'add':
          eventCache[event.projectPath] = event
          break
        default:
          throw Error(`Bad event type ${event.type}`)
      }
    })

    return _.values(eventCache)
  })
}
