import traceur from 'traceur'
import _ from 'lodash'
import Promise from 'bluebird'
import fs from 'fs'
import fse from 'fs-extra'

var copy = Promise.promisify(fse.copy)
var rm = Promise.promisify(fse.remove)

require('chai').should()

import glob from '../lib/glob'
import Event from '../lib/event'

var FIXTURE_PATH = 'test/fixtures/simple-project'
var TMP_PATH = 'test/tmp/glob'
var FIXTURE_FILES = [
  FIXTURE_PATH + '/file1.js',
  FIXTURE_PATH + '/file2.js'
]

describe('glob plugin', () => {
  it('globs a wildcard', () => {
    return glob(null, {}, FIXTURE_PATH + '/*.js').toPromise().then(updates => {
      updates.length.should.equal(2)
      _.pluck(updates, 'path').sort().should.eql(FIXTURE_FILES)
      updates.forEach(file => { file.type.should.equal('add') })
    })
  })

  it('globs two wildcards', () => {
    return glob(null, {}, FIXTURE_PATH + '/*1.js', FIXTURE_PATH + '/*2.js')
    .toPromise()
    .then(updates => {
      updates.length.should.equal(2)
      _.pluck(updates, 'path').sort().should.eql(FIXTURE_FILES)
      updates.forEach(file => { file.type.should.equal('add') })
    })
  })

  it('detects changes to two files matching globbed pattern', () => {
    return rm(TMP_PATH).then(() => {
      return copy(FIXTURE_PATH, TMP_PATH)
    })
    .then(() => {
      return new Promise(function(resolve) {
        var nUpdates = 0
        var files = [ TMP_PATH + '/file1.js', TMP_PATH + '/file2.js' ]
        glob(null, { watch: true, debounce: 200 }, TMP_PATH + '/*.js').onValue(updates => {
          if (++nUpdates === 1) {
            updates.length.should.equal(2)
            _.delay(fs.appendFile, 20, files[0], 'var file1line2 = 24;\n')
            _.delay(fs.appendFile, 100, files[1], 'var file2line2 = 25;\n')
          }
          else {
            updates.should.eql([
              new Event({ type: 'change', path: files[0] }),
              new Event({ type: 'change', path: files[1] })
            ])
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
      glob('some stream', {}, FIXTURE_PATH + '/*.js')
    }).should.throw()
  })
})
