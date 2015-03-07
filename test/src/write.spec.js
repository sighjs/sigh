import _ from 'lodash'
import fse from 'fs-extra'
import fs from 'fs'
import Promise from 'bluebird'
var { Bacon } = require('baconjs')
var { readFileSync, existsSync } = require('fs')
var rm = Promise.promisify(fse.remove)

import Event from '../lib/event'
import write from '../lib/plugin/write'

require('chai').should()

var TMP_PATH = 'test/tmp/write'
var PROJ_PATH = 'subdir/file1.js'
var TMP_FILE = TMP_PATH + '/' + PROJ_PATH

describe('write plugin', () => {
  beforeEach(() => rm(TMP_PATH))

  it('writes a single file with no map to output directory with identity map', () => {
    var data = 'var pump\n'
    var stream = Bacon.once([ new Event({ path: PROJ_PATH, type: 'add', data }) ])

    return write({ stream }, TMP_PATH).toPromise().then(events => {
      // console.log('write events %j', events)
      readFileSync(TMP_FILE).toString()
      .should.equal(data + '\n//# sourceMappingURL=file1.js.map')

      readFileSync(TMP_FILE + '.map').toString()
      .should.equal('{"version":3,"sources":["../../../../subdir/file1.js"],"names":[],"mappings":"AAAA,IAAI","file":"file1.js","sourcesContent":["var pump\\n"]}')
    })
  })

  it('write a single file containing a basePath', () => {
    var data = 'var  pumpbaby\n'
    var stream = Bacon.once([
      new Event({ basePath: 'subdir', path: PROJ_PATH, type: 'add', data })
    ])

    return write({ stream }, TMP_PATH).toPromise().then(events => {
      // subdir stripped from the output path due to basePath
      var tmpFile = TMP_PATH + '/file1.js'

      readFileSync(tmpFile).toString()
      .should.equal(data + '\n//# sourceMappingURL=file1.js.map')

      readFileSync(tmpFile + '.map').toString()
      .should.equal('{"version":3,"sources":["../../../subdir/file1.js"],"names":[],"mappings":"AAAA,KAAK","file":"file1.js","sourcesContent":["var  pumpbaby\\n"]}')
    })
  })

  it('write a single file then remove it', () => {
    var data = 'var mew\n'
    var stream = Bacon.fromArray([
      [ new Event({ path: PROJ_PATH, type: 'add', data }) ],
      [ new Event({ path: PROJ_PATH, type: 'remove', data }) ]
    ])

    return new Promise(function(resolve, reject) {
      var nValues = 0
      var writeStream = write({ stream }, TMP_PATH)

      writeStream.onValue(events => {
        // console.log('write events %j', events)
        if (++nValues === 1) {
          existsSync(TMP_FILE).should.be.ok
          existsSync(TMP_FILE + '.map').should.be.ok
        }
        else {
          existsSync(TMP_FILE).should.not.be.ok
          existsSync(TMP_FILE + '.map').should.not.be.ok
          resolve()
        }
      })
      writeStream.onError(reject)
    })
  })
})
