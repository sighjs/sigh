require('source-map-support').install()
require('chai').should()

// Ensure temporary directories are removed after each run of tests.
import Promise from 'bluebird'
import temp from 'temp'
temp.track()
const cleanup = Promise.promisify(temp.cleanup)
after(() => cleanup())
