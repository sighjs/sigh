import { Bacon, Event } from 'sigh-core'
import Promise from 'bluebird'

import filter from '../../plugin/filter'
import PipelineCompiler from '../../PipelineCompiler'
import { plugin } from './helper'

describe('filter plugin', () => {
  it('filters events according to a projectPath regex filter', () => {
    const events = [
      new Event({ type: 'add', path: 'blah.js', data: 'var blah' }),
      new Event({ type: 'add', path: 'plah.js', data: 'var plah' }),
    ]
    const stream = Bacon.constant(events)

    return filter(true, { stream }, { projectPath: /^b/ }).toPromise(Promise)
    .then(events => {
      events.length.should.equal(1)
      events[0].projectPath.should.equal('blah.js')
    })
  })

  it('filters events according to a type string filter', () => {
    const events = [
      new Event({ type: 'add', path: 'blah.js', data: 'var blah' }),
      new Event({ type: 'update', path: 'plah.js', data: 'var plah' }),
    ]
    const stream = Bacon.constant(events)

    return filter(true, { stream }, { type: 'add' }).toPromise(Promise)
    .then(events => {
      events.length.should.equal(1)
      events[0].projectPath.should.equal('blah.js')
    })
  })
})
