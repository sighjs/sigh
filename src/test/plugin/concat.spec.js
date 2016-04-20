import _ from 'lodash'
import Promise from 'bluebird'
import { Bacon, Event } from 'sigh-core'

import concat from '../../plugin/concat'
import { SourceMapConsumer } from 'source-map'
import { makeEvent } from './helper'

describe('concat plugin', () => {
  it('concatenates three javascript files', () => {
    var stream = Bacon.constant([1, 2, 3].map(num => makeEvent(num)))

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

  it('preserves treeIndex order', () => {
    var stream = Bacon.fromArray([
      [2, 1].map(num => makeEvent(num)), // first file in event array has higher tree index
    ])

    return concat({ stream }, 'output.js', 10).toPromise(Promise).then(events => {
      events[0].data.should.equal('var a1 = 1\nvar a2 = 2\n')
    })
  })

  it('should handle erroneous js file without sourcemap', () => {
    const data = "console.log('test)"

    const event = new Event({
      basePath: 'root',
      path: 'root/subdir/output.js',
      type: 'add',
      data
    })

    const stream = Bacon.constant([ event ])

    return concat({ stream }).toPromise(Promise).then(events => {
      events[0]._sourceMap.sources.length.should.equal(0);
    })
  })

  xit('strips source map comments when concatenating two javascript files', () => {
  })
})
