var MOCK_PROJECT_DIR = 'test/fixtures/simple-project'

import glob from '../lib/glob'
import _ from 'lodash'
require('chai').should()

describe('glob plugin', () => {
  it('globs a wildcard', () => {
    return glob(null, false, MOCK_PROJECT_DIR + '/*.js').toPromise().then(files => {
      files.length.should.equal(2)
      _.pluck(files, 'path').sort().should.eql([
        MOCK_PROJECT_DIR + '/file1.js',
        MOCK_PROJECT_DIR + '/file2.js'
      ])
      files.forEach(file => { file.type.should.equal('add') })
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
