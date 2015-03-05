import _ from 'lodash'
var { Bacon } = require('baconjs')

import Event from '../lib/event'
import concat from '../lib/plugin/concat'

require('chai').should()

describe('concat plugin', () => {
  var makeEvent = num => new Event({
    path: `file${num}.js`,
    type: 'add',
    data: `var a${num} = ${num}`
  })

  it('concatenates three javascript files', () => {
    var stream = Bacon.once([1, 2, 3].map(num => makeEvent(num)))

    return concat(stream, 'output.js', 10).toPromise().then(events => {
      events.length.should.equal(1)
      var { data } = events[0]
      data.should.equal('var a1 = 1\nvar a2 = 2\nvar a3 = 3\n')

      // TODO: verify source map queries
    })
  })

  it('concatenates three javascript files debouncing many add events', () => {
    var stream = Bacon.fromArray([1, 2, 3].map(num => [ makeEvent(num) ]))
    return concat(stream, 'output.js', 10).toPromise().then(events => {
      events.length.should.equal(1)
      events[0].data.should.equal('var a1 = 1\nvar a2 = 2\nvar a3 = 3\n')
    })
  })

  xit('strips source map comments when concatenating two javascript files', () => {
  })
})
