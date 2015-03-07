var should = require('chai').should()

import Bacon from 'baconjs'
import { pipelineToStream } from '../lib/stream'

describe('stream helper module', () => {
  it('pipelineToStream should create appropriate stream from array', () => {
    var stream = pipelineToStream(false, [
      { plugin(op) {
        should.not.exist(op.stream)
        return Bacon.once(1)
      } },
      { plugin(op) { return op.stream.map(v => v + 1) } }
    ])

    return stream.toPromise().then(value => value.should.equal(2))
  })

  it('pipelineToStream should pass treeIndex and observe nextTreeIndex', () => {
    pipelineToStream(false, [
      { plugin(op) { op.treeIndex.should.equal(1) } },
      { plugin(op) { op.treeIndex.should.equal(2), op.nextTreeIndex = 4 } },
      { plugin(op) { op.treeIndex.should.equal(4) } }
    ])
  })
})
