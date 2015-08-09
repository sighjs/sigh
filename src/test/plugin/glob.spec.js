import { Bacon, Event } from 'sigh-core'
import _ from 'lodash'
import Promise from 'bluebird'
import fs from 'fs'

var copy = Promise.promisify(require('fs-extra').copy)
var mkTmpDir = Promise.promisify(require('temp').mkdir)

import glob from '../../plugin/glob'

var FIXTURE_PATH = 'test/fixtures/simple-project'
var FIXTURE_FILES = [
  FIXTURE_PATH + '/file1.js',
  FIXTURE_PATH + '/file2.js'
]

describe('glob plugin', () => {
  var stream = Bacon.constant([])

  it('globs a wildcard', () => {
    return glob({ stream }, FIXTURE_PATH + '/*.js').toPromise(Promise).then(updates => {
      updates.length.should.equal(2)
      _.pluck(updates, 'projectPath').sort().should.eql(FIXTURE_FILES)
      updates.forEach(file => {
        file.initPhase.should.be.true
        file.type.should.equal('add')
        file.opTreeIndex.should.equal(1)
      })
    })
  })

  it('globs a wildcard and forwards initial input events', () => {
    var stream = Bacon.constant([new Event({
      type: 'add',
      path: 'blah.js',
      data: 'var blah',
    })])

    return glob({ stream }, FIXTURE_PATH + '/*.js').toPromise(Promise).then(events => {
      events.length.should.equal(3)

      var updates = events.slice(1)
      _.pluck(updates, 'projectPath').sort().should.eql(FIXTURE_FILES)
      updates.forEach(file => {
        file.initPhase.should.be.true
        file.type.should.equal('add')
        file.opTreeIndex.should.equal(1)
      })
    })
  })

  it('globs a wildcard using the basePath option', () => {
    var opData = { stream, treeIndex: 4 }
    return glob(opData, { basePath: FIXTURE_PATH }, '*.js')
    .toPromise(Promise)
    .then(updates => {
      opData.nextTreeIndex.should.equal(5)
      updates.length.should.equal(2)
      updates[0].projectPath.should.equal('file1.js')
      updates[1].projectPath.should.equal('file2.js')
    })
  })

  it('globs two wildcards', () => {
    var opData = { stream, treeIndex: 1 }
    return glob(opData, FIXTURE_PATH + '/*1.js', FIXTURE_PATH + '/*2.js')
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
    var tmpPath
    return mkTmpDir({ dir: 'test/tmp', prefix: 'sigh-glob-test-' }).then(_tmpPath => {
      tmpPath = _tmpPath
      return copy(FIXTURE_PATH, tmpPath)
    })
    .then(() => {
      return new Promise(function(resolve) {
        var nUpdates = 0
        var files = [ tmpPath + '/file1.js', tmpPath + '/file2.js' ]
        glob({ stream, watch: true, treeIndex: 4 }, tmpPath + '/*.js')
        .onValue(updates => {
          if (++nUpdates === 1) {
            updates.length.should.equal(2)
            _.delay(fs.appendFile, 50, files[0], 'var file1line2 = 24;\n')
            _.delay(fs.appendFile, 500, files[1], 'var file2line2 = 25;\n')
          }
          else {
            updates.should.eql([
              new Event({
                type: 'change',
                path: files[nUpdates - 2],
                initPhase: false,
                opTreeIndex: 4,
                createTime: updates[0].createTime
              }),
            ])
            if (nUpdates === 3) {
              resolve()
              return Bacon.noMore
            }
          }
        })
      })
    })
  })

  it('forwards subsequent input events along with file change events', () => {
    var delayedInputEvent = new Event({
      type: 'add',
      path: 'blah.js',
      data: 'var blah',
    })

    var twoStream = Bacon.mergeAll(
      stream,
      Bacon.later(300, [delayedInputEvent])
    )

    var tmpPath
    return mkTmpDir({ dir: 'test/tmp', prefix: 'sigh-glob-test-' }).then(_tmpPath => {
      tmpPath = _tmpPath
      return copy(FIXTURE_PATH, tmpPath)
    })
    .then(() => {
      return new Promise(function(resolve) {
        var nUpdates = 0
        var updateFile = tmpPath + '/file1.js'
        glob({ stream: twoStream, watch: true, treeIndex: 4 }, tmpPath + '/*.js')
        .onValue(updates => {
          if (++nUpdates === 1) {
            updates.length.should.equal(2)
            _.delay(fs.appendFile, 50, updateFile, 'var file1line2 = 24;\n')
          }
          else if (nUpdates === 2) {
            updates.should.eql([
              new Event({
                type: 'change',
                path: updateFile,
                initPhase: false,
                opTreeIndex: 4,
                createTime: updates[0].createTime
              }),
            ])
          }
          else {
            updates[0].should.equal(delayedInputEvent)
            resolve()
            return Bacon.noMore
          }
        })
      })
    })
  })

  it('detects new file', () => {
    var tmpPath
    return mkTmpDir({ dir: 'test/tmp', prefix: 'sigh-glob-test-2-' }).then(_tmpPath => {
      tmpPath = _tmpPath
      return copy(FIXTURE_PATH, tmpPath)
    })
    .then(() => {
      var addedFile = tmpPath + '/added-file.js'
      return new Promise(function(resolve) {
        var nUpdates = 0
        var files = [ tmpPath + '/file1.js', tmpPath + '/file2.js' ]
        glob({ stream, watch: true, treeIndex: 4 }, tmpPath + '/*.js')
        .onValue(updates => {
          if (++nUpdates === 1) {
            updates.length.should.equal(2)
            _.delay(fs.writeFile, 300, addedFile, 'var file3line1 = 33;\n')
          }
          else {
            updates.should.eql([
              new Event({
                type: 'add',
                path: addedFile,
                initPhase: false,
                opTreeIndex: 4,
                createTime: updates[0].createTime
              }),
            ])
            resolve()
            return Bacon.noMore
          }
        })
      })
    })
  })

  xit('detects file unlink', () => {
  })

  xit('detects file rename', () => {
  })
})
