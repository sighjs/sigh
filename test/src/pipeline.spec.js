import _ from 'lodash'
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

          if (nValues === 2) {
            resolve()
            return Bacon.noMore
          }
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
      // this stops the pipelines from spitting out all the events into the first
      // subscriber, emulating how a true pipeline would work using async glob etc.
      compiler.pipelines = _.mapValues(compiler.pipelines, stream => stream.delay(0))

      return Promise.all([
        new Promise(function(resolve, reject) {
          var nValues = 0
          pipeline({ compiler }, 'stream1', 'stream2').onValue(events => {
            ++nValues
            events.should.equal(nValues)
            if (nValues === 2) {
              resolve()
              return Bacon.noMore
            }
          })
        }),
        new Promise(function(resolve, reject) {
          pipeline({ compiler }, 'stream2').onValue(events => {
            events.should.equal(2)
            resolve()
            return Bacon.noMore
          })
        }),
      ])
    })
  })

  xit('throws an error when a non-existent stream name is used', () => {
  })
})
