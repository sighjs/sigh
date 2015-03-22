#!/usr/bin/env node

require('source-map-support').install()

var invoke = require('./lib/api').invoke
try {
  invoke({ watch: true })
}
catch (e) {
  console.warn(e.stack ? e.stack : e)
}
