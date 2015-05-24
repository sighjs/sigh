require('source-map-support').install()
require('chai').should()

import temp from 'temp'
temp.track()
after(() => { temp.cleanup() })
