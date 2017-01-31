import Promise from 'bluebird'
import { Bacon, Event } from 'sigh-core'

import PipelineCompiler from '../../PipelineCompiler'
import debounce from '../../plugin/debounce'
import { plugin, makeEvent } from './helper'

describe('debounce plugin', () => {
  it('debounces two streams', () => {
    const streams = Bacon.fromArray([ 1, 2 ].map(idx => [ makeEvent(idx, true) ]))
    const compiler = new PipelineCompiler
    const opData = { compiler }

    return compiler.compile([
      op => streams,
      plugin(debounce, 100)
    ])
    .then(streams => streams.toPromise(Promise))
    .then(events => {
      events = events.sort()
      events[0].path.should.equal('file1.js')
      events.length.should.equal(2)
      events[1].path.should.equal('file2.js')
    })
  })
})
