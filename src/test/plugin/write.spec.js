import _ from 'lodash'
import { Bacon, Event } from 'sigh-core'
import Promise from 'bluebird'
import { readFileSync, existsSync } from 'fs'

import write from '../../plugin/write'

const TMP_PATH = 'test/tmp/write'
const PROJ_PATH = 'subdir/file1.js'
const PROJ_PATH_BINARY = 'subdir/file2.bin'
const TMP_FILE = TMP_PATH + '/' + PROJ_PATH

describe('write plugin', () => {
  it('writes a single file with no map to output directory with identity map', () => {
    const data = 'var pump\n'
    const stream = Bacon.constant([ new Event({ path: PROJ_PATH, type: 'add', data }) ])

    return write({ stream }, TMP_PATH).toPromise(Promise).then(events => {
      // console.log('write events %j', events)
      readFileSync(TMP_FILE).toString()
      .should.equal(data + '\n//# sourceMappingURL=file1.js.map')

      readFileSync(TMP_FILE + '.map').toString()
      .should.equal('{"version":3,"sources":["../../../../subdir/file1.js"],"names":[],"mappings":"AAAA,IAAI","file":"file1.js","sourcesContent":["var pump\\n"]}')
    })
  })

  it('write a single file containing a basePath', () => {
    const data = 'var  pumpbaby\n'
    const stream = Bacon.constant([
      new Event({ basePath: 'subdir', path: PROJ_PATH, type: 'add', data })
    ])

    return write({ stream }, TMP_PATH).toPromise(Promise).then(events => {
      // subdir stripped from the output path due to basePath
      const tmpFile = TMP_PATH + '/file1.js'

      readFileSync(tmpFile).toString()
      .should.equal(data + '\n//# sourceMappingURL=file1.js.map')

      readFileSync(tmpFile + '.map').toString()
      .should.equal('{"version":3,"sources":["../../../subdir/file1.js"],"names":[],"mappings":"AAAA,KAAK","file":"file1.js","sourcesContent":["var  pumpbaby\\n"]}')
    })
  })

  it('write a binary file', () => {
    const data = new Buffer([0, 1, 2, 3, -1, 5, 6, 7, 0])
    const stream = Bacon.constant([
      new Event({ basePath: 'subdir', path: PROJ_PATH_BINARY, type: 'add', data: data.toString('binary'), encoding: 'binary', supportsSourceMap: false })
    ])

    return write({ stream }, TMP_PATH).toPromise(Promise).then(events => {
      // subdir stripped from the output path due to basePath
      const tmpFile = TMP_PATH + '/file2.bin'

      readFileSync(tmpFile).should.eql(data)
    })
  })

  it('write a single file then remove it', () => {
    const data = 'var mew\n'
    const stream = Bacon.fromArray([
      [ new Event({ path: PROJ_PATH, type: 'add', data }) ],
      [ new Event({ path: PROJ_PATH, type: 'remove', data }) ]
    ])

    return new Promise(function(resolve, reject) {
      let nValues = 0
      const writeStream = write({ stream }, TMP_PATH)

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
          return Bacon.noMore
        }
      })
      writeStream.onError(reject)
    })
  })
})
