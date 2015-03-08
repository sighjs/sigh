import Bacon from 'baconjs'
import Promise from 'bluebird'
import PipelineCompiler from '../lib/PipelineCompiler'

var should = require('chai').should()

describe('PipelineCompiler', () => {
  it('should create appropriate stream from array', () => {
    var compiler = new PipelineCompiler
    var stream = compiler.compile([
      { plugin(op) {
        should.not.exist(op.stream)
        return Bacon.once(1)
      } },
      { plugin(op) { return op.stream.map(v => v + 1) } }
    ])

    return stream.toPromise(Promise).then(value => value.should.equal(2))
  })

  it('should create stream from stream, passing watch option', () => {
    var compiler = new PipelineCompiler({ watch: true })
    var stream = compiler.compile({ plugin(op) {
      op.watch.should.be.true
      should.not.exist(op.stream)
      return Bacon.once(420)
    } })

    return stream.toPromise(Promise).then(value => value.should.equal(420))
  })

  it('should pass arguments to plugin', () => {
    var compiler = new PipelineCompiler
    var stream = compiler.compile({
      plugin(op, arg1, arg2) {
        should.not.exist(op.watch)
        should.not.exist(op.stream)
        return Bacon.once(arg1 + arg2)
      },
      args: [ 7, 11 ]
    })

    return stream.toPromise(Promise).then(value => value.should.equal(18))
  })

  it('should pass treeIndex and observe nextTreeIndex', () => {
    var compiler = new PipelineCompiler
    compiler.compile([
      { plugin(op) { op.treeIndex.should.equal(1) } },
      { plugin(op) { op.treeIndex.should.equal(2), op.treeIndex = 4 } },
      { plugin(op) { op.treeIndex.should.equal(4) } }
    ])
  })
})
