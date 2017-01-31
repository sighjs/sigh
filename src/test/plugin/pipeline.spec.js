import _ from 'lodash'
import Promise from 'bluebird'
import { Bacon } from 'sigh-core'

import PipelineCompiler from '../../PipelineCompiler'
import pipeline from '../../plugin/pipeline'

describe('pipeline plugin', () => {
  let compiler, stream
  beforeEach(() => {
    compiler = new PipelineCompiler
    stream = compiler.initStream
  })

  it('intercepts the end of two pipelines', () => {
    return Promise.all([1, 2].map(
      idx => compiler.compile(op => Bacon.constant(idx), null, `stream${idx}`)
    ))
    .then(streams => {
      return new Promise(function(resolve, reject) {
        let nValues = 0
        pipeline({ stream, compiler }, 'stream1', 'stream2').onValue(events => {
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
    return Promise.all([1, 2].map(
      idx => compiler.compile(op => Bacon.constant(idx), null, `stream${idx}`)
    ))
    .then(streams => {
      // this stops the pipelines from spitting out all the events into the first
      // subscriber, emulating how a true pipeline would work using async glob etc.
      compiler.streams = _.mapValues(compiler.streams, stream => stream.delay(0))

      return Promise.all([
        new Promise(function(resolve, reject) {
          let nValues = 0
          pipeline({ stream, compiler }, 'stream1', 'stream2').onValue(events => {
            ++nValues
            events.should.equal(nValues)
            if (nValues === 2) {
              resolve()
              return Bacon.noMore
            }
          })
        }),
        new Promise(function(resolve, reject) {
          pipeline({ stream, compiler }, 'stream2').onValue(events => {
            events.should.equal(2)
            resolve()
            return Bacon.noMore
          })
        }),
      ])
    })
  })

  it('can subscribe to a pipeline before it has been compiled', () => {
    const pipelineOp = pipeline({ stream, compiler }, 'stream')

    compiler.compile(op => Bacon.constant(1), null, 'stream')
    .then(stream => {
      compiler.streams.stream = compiler.streams.stream.delay(0)
      return pipelineOp.toPromise(Promise)
    })
    .then(function(values) {
      values.should.eql(1)
    })
  })
})
