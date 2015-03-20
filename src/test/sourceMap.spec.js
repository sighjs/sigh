import Bacon from 'baconjs'
import Promise from 'bluebird'
import { SourceMapConsumer } from 'source-map'

import { positionOf } from '../sourceMap'
import Event from '../Event'
import concat from '../plugin/concat'
import babel from '../plugin/babel'

var should = require('chai').should()

describe('sourceMap helper module', () => {
  var makeEvent = num => new Event({
    path: `file${num}.js`,
    type: 'add',
    opTreeIndex: num,
    data: `var add${num} = b => b + ${num}`
  })

  describe('positionOf', () => {
    it('returns line/column of match on third line', () => {
      var pos = positionOf('111\n222\n3a\n14', 'a')
      pos.line.should.equal(3)
      pos.column.should.equal(1)
    })

    it('returns null for failed match', () => {
      var pos = positionOf('111\n222\n3a\n14', 'b')
      should.not.exist(pos)
    })
  })

  it('applies one source map to another', () => {
    var inputStream = Bacon.once([1, 2].map(num => makeEvent(num)))
    var concatStream = concat({ stream: inputStream }, 'output.js', 10)
    var babelStream = babel({ stream: concatStream })

    return babelStream.toPromise(Promise).then(events => {
      events.length.should.equal(1)
      var { sourceMap, data } = events[0]

      var consumer = new SourceMapConsumer(sourceMap)
      // verify mapping of token "add1"
      var pos = consumer.originalPositionFor(positionOf(data, 'add1'))
      pos.line.should.equal(1)
      pos.column.should.equal(4)
      pos.source.should.equal('file1.js')

      // verify mapping of token "add2"
      pos = consumer.originalPositionFor(positionOf(data, 'add2'))
      pos.line.should.equal(1)
      pos.column.should.equal(4)
      pos.source.should.equal('file2.js')
    })
  })
})
