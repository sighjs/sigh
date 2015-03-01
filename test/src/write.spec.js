import _ from 'lodash'
import fse from 'fs-extra'
import fs from 'fs'
import Promise from 'bluebird'
var { Bacon } = require('baconjs')
var { readFileSync, existsSync } = require('fs')
var rm = Promise.promisify(fse.remove)

require('chai').should()

import write from '../lib/write'
import Event from '../lib/event'

var TMP_PATH = 'test/tmp/write'
var TMP_FILE = TMP_PATH + '/file1.js'

describe('write plugin', () => {
  beforeEach(() => rm(TMP_PATH))

  it('writes a single file with no map to output directory with identity map', () => {
    var data = 'var pump\n'
    var stream = Bacon.once([ new Event({ path: 'file1.js', type: 'add', data }) ])

    return write(stream, TMP_PATH).toPromise().then(events => {
      // console.log('write events %j', events)
      readFileSync(TMP_FILE).toString()
      .should.equal(data + '\n//# sourceMappingURL=file1.js.map')

      readFileSync(TMP_FILE + '.map').toString()
      .should.equal('{"version":3,"sources":["../../../file1.js"],"names":[],"mappings":"AAAA,IAAI","file":"file1.js"}')
    })
  })

  it('write a single file then remove it', () => {
    var data = 'var mew\n'
    var stream = Bacon.fromArray([
      [ new Event({ path: 'file1.js', type: 'add', data }) ],
      [ new Event({ path: 'file1.js', type: 'remove', data }) ]
    ])

    return new Promise(function(resolve, reject) {
      var nValues = 0
      var writeStream = write(stream, TMP_PATH)

      writeStream.onValue(events => {
        // console.log('write events %j', events)
        if (++nValues === 1) {
          existsSync(TMP_FILE).should.be.ok
        }
        else {
          existsSync(TMP_FILE).should.not.be.ok
          resolve()
        }
      })
      writeStream.onError(e => { console.warn(e) })
    })
  })
})
