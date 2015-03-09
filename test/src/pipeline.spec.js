import Promise from 'bluebird'
import Bacon from 'baconjs'

import PipelineCompiler from '../lib/PipelineCompiler'
import pipeline from '../lib/plugin/pipeline'
import { plugin, makeEvent } from './helper'

describe('pipeline plugin', () => {
  it('intercepts the end of two pipelines', () => {
    var compiler = new PipelineCompiler
    var opData = { compiler }

    return Promise.all([1, 2].map(
      idx => compiler.compile([ plugin(op => Bacon.once(idx)) ], null, `stream${idx}`)
    ))
    .then(streams => {
      return new Promise(function(resolve, reject) {
        var nValues = 0
        pipeline({ compiler }, 'stream1', 'stream2').onValue(events => {
          ++nValues
          events.should.eql(nValues)

          if (nValues === 2)
            resolve()
        })
      })
    })
  })

  xit('throws an error when a non-existent stream name is used', () => {
  })
})
