import Promise from 'bluebird'

var copy = Promise.promisify(require('fs-extra').copy)
var mkTmpDir = Promise.promisify(require('temp').mkdir)

import PipelineCompiler from '../PipelineCompiler'
import { compileSighfile } from '../api'

var FIXTURE_PATH = 'test/fixtures/sigh-project'

describe('api', () => {
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
