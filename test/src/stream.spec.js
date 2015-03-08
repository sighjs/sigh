import Bacon from 'baconjs'
import Promise from 'bluebird'
import { pipelineToStream } from '../lib/stream'

var should = require('chai').should()

describe('stream helper module', () => {
  it('pipelineToStream should create appropriate stream from array', () => {
    var stream = pipelineToStream({}, [
      { plugin(op) {
        should.not.exist(op.stream)
        return Bacon.once(1)
      } },
      { plugin(op) { return op.stream.map(v => v + 1) } }
    ])

    return stream.toPromise(Promise).then(value => value.should.equal(2))
  })

  it('pipelineToStream should create stream from stream, passing watch option', () => {
    var stream = pipelineToStream({ watch: true }, { plugin(op) {
      op.watch.should.be.true
      should.not.exist(op.stream)
      return Bacon.once(420)
    } })

    return stream.toPromise(Promise).then(value => value.should.equal(420))
  })

  it('pipelineToStream should pass arguments to plugin', () => {
    var stream = pipelineToStream({}, {
      plugin(op, arg1, arg2) {
        should.not.exist(op.watch)
        should.not.exist(op.stream)
        return Bacon.once(arg1 + arg2)
      },
      args: [ 7, 11 ]
    })

    return stream.toPromise(Promise).then(value => value.should.equal(18))
  })

  it('pipelineToStream should pass treeIndex and observe nextTreeIndex', () => {
    pipelineToStream({}, [
      { plugin(op) { op.treeIndex.should.equal(1) } },
      { plugin(op) { op.treeIndex.should.equal(2), op.treeIndex = 4 } },
      { plugin(op) { op.treeIndex.should.equal(4) } }
    ])
  })
})
