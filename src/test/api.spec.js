import Promise from 'bluebird'
import fse from 'fs-extra'
var copy = Promise.promisify(fse.copy)
var rm = Promise.promisify(fse.remove)

import PipelineCompiler from '../PipelineCompiler'
import { compileSighfile } from '../api'

var FIXTURE_PATH = 'test/fixtures/sigh-project'
var TMP_PATH = 'test/tmp/api'

describe('api', () => {
  it('compile should build working bacon streams from pipelines in Sigh.js file', function() {
    this.timeout(3000)

    var pathBackup, compiler

    return rm(TMP_PATH)
    .then(() => copy(FIXTURE_PATH, TMP_PATH))
    .then(() => {
      pathBackup = process.cwd()
      process.chdir(TMP_PATH)

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
