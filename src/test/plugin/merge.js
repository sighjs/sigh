import _ from 'lodash'
import Promise from 'bluebird'
import { Bacon } from 'sigh-core'

import PipelineCompiler from '../../lib/PipelineCompiler'
import merge from '../../lib/plugin/merge'
import { plugin, makeEvent } from './helper'

describe('merge plugin', () => {
  it('combines three streams into one', () => {
    const streams = [1, 2, 3].map(i => plugin(op => Bacon.constant([ makeEvent(i) ])))
    const opData = { compiler: new PipelineCompiler }

    return merge(opData, ...streams).then(streams => {
      let nEvents = 0
      return new Promise(function(resolve, reject) {
        streams.onValue(events => {
          ++nEvents
          events.length.should.equal(1)
          events[0].path.should.equal(`file${nEvents}.js`)
          if (nEvents === 3) {
            resolve()
            return Bacon.noMore
          }
        })
      })
    })
  })

  it('assigns treeIndex to sub-operations', () => {
    const compiler = new PipelineCompiler
    const opData = { compiler }
    const streams = [
      plugin(op => op.treeIndex.should.equal(1)),
      plugin(op => op.treeIndex.should.equal(2))
    ]

    return compiler.compile([ plugin(merge, ...streams) ])
  })

  it('increments treeIndex for subsequent operations', () => {
    const compiler = new PipelineCompiler
    const opData = { compiler }
    const streams = [ plugin(op => 1), plugin(op => 2) ]

    return compiler.compile([
      plugin(merge, ...streams),
      plugin(op => op.treeIndex.should.equal(3))
    ])
  })
})
