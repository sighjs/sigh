import glob from '../lib/glob'
import _ from 'lodash'
import Promise from 'bluebird'
import fs from 'fs'
import fse from 'fs-extra'

var copy = Promise.promisify(fse.copy)
var rm = Promise.promisify(fse.remove)

require('chai').should()

var MOCK_PROJECT_DIR = 'test/fixtures/simple-project'
var TMP_DIR = 'test/tmp'

describe('glob plugin', () => {
  it('globs a wildcard', () => {
    return glob(null, false, MOCK_PROJECT_DIR + '/*.js').toPromise().then(updates => {
      updates.length.should.equal(2)
      _.pluck(updates, 'path').sort().should.eql([
        MOCK_PROJECT_DIR + '/file1.js',
        MOCK_PROJECT_DIR + '/file2.js'
      ])
      updates.forEach(file => { file.type.should.equal('add') })
    })
  })

  it('globs a wildcard and detects a file update', () => {
    return rm(TMP_DIR).then(() => {
      return copy(MOCK_PROJECT_DIR, TMP_DIR)
    })
    .then(() => {
      return new Promise(function(resolve) {
        var isWatching = false
        var changeFile = TMP_DIR + '/file1.js'
        glob(null, true, TMP_DIR + '/*.js').onValue(updates => {
          if (! isWatching) {
            updates.length.should.equal(2)
            isWatching = true
            console.log("appending %j", updates)
            _.delay(fs.appendFile, 20, changeFile, 'var line2 = 24;\n')
          }
          else {
            // TODO: should be array
            updates.should.eql({ type: 'change', path: changeFile })
            resolve()
          }
        })
      })
    })
  })

  it('only accepts first position in pipeline', () => {
    (() => {
      // the first argument is the stream and must be null for the glob operation,
      // this is a special value passed during the stream construction in src/api.js
      glob('some stream', false, MOCK_PROJECT_DIR + '/*.js')
    }).should.throw()
  })
})
