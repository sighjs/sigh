import Promise from 'bluebird'

var copy = Promise.promisify(require('fs-extra').copy)
var mkTmpDir = Promise.promisify(require('temp').mkdir)

import PipelineCompiler from '../PipelineCompiler'
import { compileSighfile } from '../api'
import rewire from 'rewire'

var FIXTURE_PATH = 'test/fixtures/sigh-project'

describe('loadPipelineDependencies', () => {
  const pipelinePlugin = require('../plugin/pipeline').default
  const mergePlugin = require('../plugin/merge').default
  const fakePlugin = {}

  const loadPipelineDependencies = rewire('../api').__get__('loadPipelineDependencies')

  const makePluginDesc = (plugin, args = []) => ({ plugin, args })

  const pipelines = {
    dep1: [ makePluginDesc(fakePlugin, ['1']) ],
    dep2: [ makePluginDesc(fakePlugin, ['2']) ],
  }


  it('should ignore pipeline activation in first leaf and detect subsequent activation', function() {
    const runPipelines = {
      main: [
        { plugin: pipelinePlugin, args: [{ activate: true }, 'dep2'] },
        { plugin: pipelinePlugin, args: [{ activate: true }, 'dep1'] }
      ]
    }

    const deps = loadPipelineDependencies(runPipelines, pipelines)
    deps.should.have.property('dep1').and.equal(pipelines.dep1)
    deps.should.not.have.property('dep2')
  })

  it('should detect pipeline activation in merge, ignoring activation in first leaf node', function() {
    const runPipelines = {
      main: [
        makePluginDesc(mergePlugin, [
          { plugin: pipelinePlugin, args: [{ activate: true }, 'dep2'] },
          { plugin: pipelinePlugin, args: [{ activate: true }, 'dep1'] },
        ]),
      ]
    }

    const deps = loadPipelineDependencies(runPipelines, pipelines)
    deps.should.have.property('dep1').and.equal(pipelines.dep1)
    deps.should.not.have.property('dep2')
  })
})

describe('compileSighFile', () => {
  it('compile should build working bacon streams from pipelines in Sigh.js file', function() {
    this.timeout(3000)

    var pathBackup, compiler, tmpPath

    return mkTmpDir({ dir: 'test/tmp', prefix: 'sigh-api-test-' })
    .then(_tmpPath => {
      tmpPath = _tmpPath
      return copy(FIXTURE_PATH, tmpPath)
    })
    .then(() => {
      pathBackup = process.cwd()
      process.chdir(tmpPath)

      var opts = { environment: 'production' }
      compiler = new PipelineCompiler(opts)
      return compileSighfile(compiler, opts)
    })
    .then(streams => streams.js.toPromise(Promise))
    .then(events => {
      events.length.should.equal(1)
      var event = events[0]
      event.path.should.equal('dist/combined.js')
    })
    .finally(() => {
      compiler.destroy()
      if (pathBackup)
        process.chdir(pathBackup)
    })
  })
})
