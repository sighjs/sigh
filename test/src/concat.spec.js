import _ from 'lodash'
import Promise from 'bluebird'
import Bacon from 'baconjs'

import Event from '../lib/Event'
import concat from '../lib/plugin/concat'
import { SourceMapConsumer } from 'source-map'
import { makeEvent } from './helper'

describe('concat plugin', () => {
  it('concatenates three javascript files', () => {
    var stream = Bacon.once([1, 2, 3].map(num => makeEvent(num)))

    return concat({ stream }, 'output.js', 10).toPromise(Promise).then(events => {
      events.length.should.equal(1)
      var { data, sourceMap } = events[0]
      data.should.equal('var a1 = 1\nvar a2 = 2\nvar a3 = 3\n')

      var consumer = new SourceMapConsumer(sourceMap)
      var varPos = [1, 2, 3].map(line => consumer.originalPositionFor({ line, column: 0 }))
      varPos.forEach((pos, idx) => {
        pos.line.should.equal(1)
        pos.source.should.equal(`file${idx + 1}.js`)
      })
    })
  })

  it('concatenates three javascript files debouncing many add events', () => {
    var stream = Bacon.fromArray([1, 2, 3].map(num => [ makeEvent(num) ]))
    return concat({ stream }, 'output.js', 10).toPromise(Promise).then(events => {
      events.length.should.equal(1)
      events[0].data.should.equal('var a1 = 1\nvar a2 = 2\nvar a3 = 3\n')
    })
  })

  it('preserves treeIndex order', () => {
    var stream = Bacon.fromArray([
      [2, 1].map(num => makeEvent(num)), // first file in event array has higher tree index
    ])

    return concat({ stream }, 'output.js', 10).toPromise(Promise).then(events => {
      events[0].data.should.equal('var a1 = 1\nvar a2 = 2\n')
    })
  })

  xit('strips source map comments when concatenating two javascript files', () => {
  })
})
