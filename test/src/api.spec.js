import Promise from 'bluebird'
import fse from 'fs-extra'
var copy = Promise.promisify(fse.copy)
var rm = Promise.promisify(fse.remove)

import { compile } from '../lib/api'

var FIXTURE_PATH = 'test/fixtures/sigh-project'
var TMP_PATH = 'test/tmp/api'

describe('api', () => {
  it('compile should build working bacon streams from pipelines in Sigh.js file', () => {
    var pathBackup
    return rm(TMP_PATH).then(() => {
      return copy(FIXTURE_PATH, TMP_PATH)
    })
    .then(() => {
      pathBackup = process.cwd()
      process.chdir(TMP_PATH)
      return compile({ environment: 'production' })
    })
    .then(streams => streams.js.toPromise())
    .then(events => {
      events.length.should.equal(1)
      var event = events[0]
      event.path.should.equal('dist/combined.js')
    })
    .finally(() => {
      if (pathBackup)
        process.chdir(pathBackup)
    })
  })
})
