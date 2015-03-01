import _ from 'lodash'
import fse from 'fs-extra'
import fs from 'fs'
import Promise from 'bluebird'
var { Bacon } = require('baconjs')
var { readFileSync } = require('fs')
var rm = Promise.promisify(fse.remove)

require('chai').should()

import write from '../lib/write'
import Event from '../lib/event'

var TMP_PATH = 'test/tmp/write'

describe('write plugin', () => {
  beforeEach(() => rm(TMP_PATH))

  it('writes a single file with no map to output directory with identity map', () => {
    var data = 'var pump\n'
    var stream = Bacon.once([ new Event({ path: 'file1.js', type: 'add', data }) ])

    return write(stream, TMP_PATH).toPromise().then(events => {
      // console.log('write events', events)
      readFileSync(TMP_PATH + '/file1.js').toString()
      .should.equal(data + '\n//# sourceMappingURL=file1.js.map')

      readFileSync(TMP_PATH + '/file1.js.map').toString()
      .should.equal('{"version":3,"sources":["../../../file1.js"],"names":[],"mappings":"AAAA,IAAI","file":"file1.js"}')
    })
  })
})
