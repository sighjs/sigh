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

  it('can subscripe to the same stream as another pipeline', () => {
    var compiler = new PipelineCompiler
    var opData = { compiler }

    return Promise.all([1, 2].map(
      idx => compiler.compile([ plugin(op => Bacon.once(idx)) ], null, `stream${idx}`)
    ))
    .then(streams => {
      return Promise.all([
        new Promise(function(resolve, reject) {
          var nValues = 0
          pipeline({ compiler }, 'stream1', 'stream2').onValue(events => {
            ++nValues
            events.should.equal(nValues)

            console.log("debug:sub1", nValues)
            if (nValues === 2)
              resolve()
          })
        }),
        pipeline({ compiler }, 'stream2').toPromise(Promise).then(events => {
          console.log("debug:sub2")
          events.should.eql(2)
        })
      ])
    })
  })

  xit('throws an error when a non-existent stream name is used', () => {
  })
})
