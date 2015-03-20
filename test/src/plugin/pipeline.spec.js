import _ from 'lodash'
import Promise from 'bluebird'
import Bacon from 'baconjs'

import PipelineCompiler from '../../lib/PipelineCompiler'
import pipeline from '../../lib/plugin/pipeline'

describe('pipeline plugin', () => {
  it('intercepts the end of two pipelines', () => {
    var compiler = new PipelineCompiler

    return Promise.all([1, 2].map(
      idx => compiler.compile(op => Bacon.once(idx), null, `stream${idx}`)
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

  it('can subscribe to the same stream as another pipeline', () => {
    var compiler = new PipelineCompiler

    return Promise.all([1, 2].map(
      idx => compiler.compile(op => Bacon.once(idx), null, `stream${idx}`)
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

  it('can subscribe to a pipeline before it has been created', () => {
    var compiler = new PipelineCompiler

    var pipelineOp = pipeline({ compiler }, 'stream').toPromise(Promise)

    compiler.compile(op => Bacon.once(1), null, 'stream')
    .then(stream => {
      compiler.pipelines.stream = compiler.pipelines.stream.delay(0)
      return pipelineOp
    })
    .then(function(values) {
      values.should.eql(1)
    })
  })
})
