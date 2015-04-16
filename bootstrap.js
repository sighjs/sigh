#!/usr/bin/env node

require('source-map-support').install()

var invoke = require('./lib/api').invoke
invoke({ watch: true, jobs: 4 })
