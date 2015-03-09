import _ from 'lodash'
import Promise from 'bluebird'
import Bacon from 'baconjs'

import PipelineCompiler from '../lib/PipelineCompiler'
import all from '../lib/plugin/all'
import { plugin, makeEvent } from './helper'

describe('all plugin', () => {
  it('combines three streams into one', () => {
    var streams = [1, 2, 3].map(i => plugin(op => Bacon.once([ makeEvent(i) ])))
    var opData = { compiler: new PipelineCompiler }

    return all(opData, ...streams).then(streams => {
      var nEvents = 0
      return new Promise(function(resolve, reject) {
        streams.onValue(events => {
          ++nEvents
          events.length.should.equal(1)
          events[0].path.should.equal(`file${nEvents}.js`)
          if (nEvents === 3)
            resolve()
        })
      })
    })
  })

  it('assigns treeIndex to sub-operations', () => {
    var compiler = new PipelineCompiler
    var opData = { compiler }
    var streams = [
      plugin(op => op.treeIndex.should.equal(1)),
      plugin(op => op.treeIndex.should.equal(2))
    ]

    return compiler.compile([ plugin(all, ...streams) ])
  })

  it('increments treeIndex for subsequent operations', () => {
    var compiler = new PipelineCompiler
    var opData = { compiler }
    var streams = [ plugin(op => 1), plugin(op => 2) ]

    return compiler.compile([
      plugin(all, ...streams),
      plugin(op => op.treeIndex.should.equal(3))
    ])
  })
})
