import { Bacon } from 'sigh-core'
import Promise from 'bluebird'
import PipelineCompiler from '../PipelineCompiler'

import { plugin } from './plugin/helper'

var should = require('chai').should()

describe('PipelineCompiler', () => {
  it('should create appropriate stream from array', () => {
    var compiler = new PipelineCompiler
    return compiler.compile([
      op => {
        // TODO: test op.stream is Bacon.constant([])
        return Bacon.constant(1)
      },
      op => op.stream.map(v => v + 1)
    ])
    .then(stream => stream.toPromise(Promise).then(value => value.should.equal(2)))
  })

  it('should create stream from stream, passing watch option', () => {
    var compiler = new PipelineCompiler({ watch: true })
    return compiler.compile(op => {
      op.watch.should.be.true
      // TODO: test op.stream is Bacon.constant([])
      return Bacon.constant(420)
    })
    .then(
      stream => stream.toPromise(Promise).then(value => value.should.equal(420))
    )
  })

  it('should pass arguments to plugin', () => {
    var compiler = new PipelineCompiler
    return compiler.compile(plugin((op, arg1, arg2) => {
        should.not.exist(op.watch)
        // TODO: test op.stream is Bacon.constant([])
        return Bacon.constant(arg1 + arg2)
    }, 7, 11))
    .then(stream => stream.toPromise(Promise).then(value => value.should.equal(18)))
  })

  it('should pass treeIndex and observe nextTreeIndex', () => {
    var compiler = new PipelineCompiler
    return compiler.compile([
      op => { op.treeIndex.should.equal(1) },
      op => { op.treeIndex.should.equal(2), op.treeIndex = 4 },
      op => { op.treeIndex.should.equal(4) }
    ])
  })
})
