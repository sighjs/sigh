require('chai').should()

import { pipelineToStream } from '../lib/stream'

describe('stream helper module', () => {
  it('pipelineToStream should pass treeIndex and observe nextTreeIndex', () => {
    pipelineToStream(false, [
      { plugin(op) { op.treeIndex.should.equal(1) } },
      { plugin(op) { op.treeIndex.should.equal(2), op.nextTreeIndex = 4 } },
      { plugin(op) { op.treeIndex.should.equal(4) } }
    ])
  })
})
