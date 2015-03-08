import _ from 'lodash'
import Promise from 'bluebird'
import Bacon from 'baconjs'

import PipelineCompiler from '../lib/PipelineCompiler'
import Event from '../lib/Event'
import all from '../lib/plugin/all'
import { plugin } from './helper'

describe('all plugin', () => {
  var makeEvent = num => new Event({
    path: `file${num}.js`,
    type: 'add',
    opTreeIndex: num,
    data: `var a${num} = ${num}`
  })

  it('combines three streams into one', () => {
    var streams = [1, 2, 3].map(i => plugin(op => Bacon.once([ makeEvent(i) ])))
    var opData = { compiler: new PipelineCompiler }
    return all(opData, { debounce: 100 }, ...streams).toPromise(Promise).then(events => {
      events.length.should.equal(3)
    })
  })

  it('assigns treeIndex to sub-operations', () => {
    var compiler = new PipelineCompiler
    var opData = { compiler }
    var streams = [
      plugin(op => op.treeIndex.should.equal(1)),
      plugin(op => op.treeIndex.should.equal(2))
    ]

    compiler.compile([
      plugin(all, { debounce: 100 }, ...streams),
      plugin(op => op.treeIndex.should.equal(3))
    ])
  })
})
