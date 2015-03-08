import _ from 'lodash'
import Bacon from 'baconjs'

import Event from '../lib/event'
import all from '../lib/plugin/all'

describe('all plugin', () => {
  var makeEvent = num => new Event({
    path: `file${num}.js`,
    type: 'add',
    opTreeIndex: num,
    data: `var a${num} = ${num}`
  })

  it('combines three streams into one', () => {
    var streams = [1, 2, 3].map(i => ({
      plugin: op => Bacon.once([ makeEvent(i) ])
    }))
    return all({}, { debounce: 100 }, ...streams).toPromise().then(events => {
      events.length.should.equal(3)
    })
  })
})
