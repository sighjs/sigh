import Bacon from 'baconjs'
import Promise from 'bluebird'

import Event from '../lib/Event'
import env from '../lib/plugin/env'
import PipelineCompiler from '../lib/PipelineCompiler'
import { plugin } from './helper'

describe('env plugin', () => {
  it('modifies stream when selected environment is chosen', () => {
    var compiler = new PipelineCompiler({ environment: 'friend' })
    var streams = [
      op => Bacon.once(8),
      plugin(env, op => op.stream.map(val => val * 2), 'friend')
    ]

    return compiler.compile(streams).then(
      stream => stream.toPromise(Promise).then(v => { v.should.equal(16) })
    )
  })

  it('passes stream through when selected environments are not chosen', () => {
    var compiler = new PipelineCompiler({ environment: 'e1' })
    var streams = [
      op => Bacon.once(9),
      plugin(env, op => op.stream.map(val => val * 2), 'e2', 'e3')
    ]

    return compiler.compile(streams).then(
      stream => stream.toPromise(Promise).then(v => { v.should.equal(9) })
    )
  })
})
