import _ from 'lodash'
import Promise from 'bluebird'
import fs from 'fs'
import fse from 'fs-extra'

var copy = Promise.promisify(fse.copy)
var rm = Promise.promisify(fse.remove)

import Event from '../lib/Event'
import glob from '../lib/plugin/glob'

var FIXTURE_PATH = 'test/fixtures/simple-project'
var TMP_PATH = 'test/tmp/glob'
var FIXTURE_FILES = [
  FIXTURE_PATH + '/file1.js',
  FIXTURE_PATH + '/file2.js'
]

describe('glob plugin', () => {
  it('globs a wildcard', () => {
    return glob({}, {}, FIXTURE_PATH + '/*.js').toPromise(Promise).then(updates => {
      updates.length.should.equal(2)
      _.pluck(updates, 'projectPath').sort().should.eql(FIXTURE_FILES)
      updates.forEach(file => {
        file.type.should.equal('add')
        file.opTreeIndex.should.equal(1)
      })
    })
  })

  it('globs a wildcard using the basePath option', () => {
    var opData = { treeIndex: 4 }
    return glob(opData, { basePath: 'test/fixtures/simple-project' }, '*.js')
    .toPromise(Promise)
    .then(updates => {
      opData.nextTreeIndex.should.equal(5)
      updates.length.should.equal(2)
      updates[0].projectPath.should.equal('file1.js')
      updates[1].projectPath.should.equal('file2.js')
    })
  })

  it('globs two wildcards', () => {
    var opData = { treeIndex: 1 }
    return glob(opData, {}, FIXTURE_PATH + '/*1.js', FIXTURE_PATH + '/*2.js')
    .toPromise(Promise)
    .then(updates => {
      opData.nextTreeIndex.should.equal(3)
      updates.length.should.equal(2)
      _.pluck(updates, 'path').sort().should.eql(FIXTURE_FILES)
      updates[0].opTreeIndex.should.equal(1)
      updates[1].opTreeIndex.should.equal(2)
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
        glob({ watch: true, treeIndex: 4 }, { debounce: 100 }, TMP_PATH + '/*.js')
        .onValue(updates => {
          if (++nUpdates === 1) {
            updates.length.should.equal(2)
            _.delay(fs.appendFile, 20, files[0], 'var file1line2 = 24;\n')
            _.delay(fs.appendFile, 100, files[1], 'var file2line2 = 25;\n')
          }
          else {
            updates.should.eql([
              new Event({ type: 'change', path: files[0], opTreeIndex: 4 }),
              new Event({ type: 'change', path: files[1], opTreeIndex: 4 })
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
      glob({ stream: 'some stream' }, {}, FIXTURE_PATH + '/*.js')
    }).should.throw()
  })
})
