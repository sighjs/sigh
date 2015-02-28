import glob from '../lib/glob'
import _ from 'lodash'
import Promise from 'bluebird'
import fs from 'fs'
import fse from 'fs-extra'

var copy = Promise.promisify(fse.copy)
var rm = Promise.promisify(fse.remove)

require('chai').should()

var FIXTURE_PATH = 'test/fixtures/simple-project'
var TMP_PATH = 'test/tmp'
var FIXTURE_FILES = [
  FIXTURE_PATH + '/file1.js',
  FIXTURE_PATH + '/file2.js'
]

describe('glob plugin', () => {
  it('globs a wildcard', () => {
    return glob(null, false, FIXTURE_PATH + '/*.js').toPromise().then(updates => {
      updates.length.should.equal(2)
      _.pluck(updates, 'path').sort().should.eql(FIXTURE_FILES)
      updates.forEach(file => { file.type.should.equal('add') })
    })
  })

  it('globs two wildcards', () => {
    return glob(null, false, FIXTURE_PATH + '/*1.js', FIXTURE_PATH + '/*2.js')
    .toPromise()
    .then(updates => {
      updates.length.should.equal(2)
      _.pluck(updates, 'path').sort().should.eql(FIXTURE_FILES)
      updates.forEach(file => { file.type.should.equal('add') })
    })
  })

  it('detects change to file matching globbed pattern', () => {
    return rm(TMP_PATH).then(() => {
      return copy(FIXTURE_PATH, TMP_PATH)
    })
    .then(() => {
      return new Promise(function(resolve) {
        var isWatching = false
        var changeFile = TMP_PATH + '/file1.js'
        glob(null, true, TMP_PATH + '/*.js').onValue(updates => {
          if (! isWatching) {
            updates.length.should.equal(2)
            isWatching = true
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
      glob('some stream', false, FIXTURE_PATH + '/*.js')
    }).should.throw()
  })
})
