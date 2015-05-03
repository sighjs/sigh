import { Bacon } from 'sigh-core'
import gulpUglify from 'gulp-uglify'
import { SourceMapConsumer } from 'source-map'
import { positionOf } from 'sigh-core/lib/sourceMap'

import Event from '../Event'
import gulpAdapter from '../gulp-adapter'

describe('gulp adapter', () => {
  it('adapts the gulp-uglify plugin', () => {
    var adapted = gulpAdapter(gulpUglify)

    var data = '  function hey() {\n  return    14 }\n\n  var a = 1'
    var stream = Bacon.constant([ new Event({ path: 'file1.js', type: 'add', data }) ])

    // TODO: s/firstT/t/
    return adapted({ stream }).firstToPromise(Promise).then(events => {
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
  })
})
