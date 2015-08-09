import Promise from 'bluebird'
import { Bacon, Event } from 'sigh-core'
import gulpUglify from 'gulp-uglify'
import { SourceMapConsumer } from 'source-map'
import { positionOf } from 'sigh-core/lib/sourceMap'

import gulpAdapter from '../gulp-adapter'

describe('gulp adapter', () => {
  it('adapts the gulp-uglify plugin', () => {
    var adapted = gulpAdapter(gulpUglify)

    var data = '  function hey() {\n  return    14 }\n\n  var a = 1'
    var stream = Bacon.constant([ new Event({ path: 'file1.js', type: 'add', data }) ])

    var op = adapted({ stream })
    var nCalls = 0

    op.onValue(events => {
      ++nCalls
      events.length.should.equal(1)
      var event = events[0]
      var sizeReduction = data.length - event.data.length
      // verify data is smaller (minified)
      sizeReduction.should.be.greaterThan(10)

      // verify the source map
      var consumer = new SourceMapConsumer(event.sourceMap)
      var origPos = positionOf(data, 'var')
      origPos.should.eql({ line: 4, column: 2 })
      var transformedPos = positionOf(event.data, 'var')
      transformedPos.should.eql({ line: 1, column: 25 })
      var mappedPos = consumer.originalPositionFor(transformedPos)

      origPos.line.should.not.equal(transformedPos.line)
      origPos.line.should.equal(mappedPos.line)
      origPos.column.should.equal(mappedPos.column)
    })

    return new Promise(resolve => {
      op.onEnd(() => {
        nCalls.should.equal(1)
        resolve()
      })
    })
  })
})
