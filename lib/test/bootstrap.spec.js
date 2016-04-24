'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

// Ensure temporary directories are removed after each run of tests.

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _temp = require('temp');

var _temp2 = _interopRequireDefault(_temp);

require('source-map-support').install();
require('chai').should();
_temp2['default'].track();
var cleanup = _bluebird2['default'].promisify(_temp2['default'].cleanup);
after(function () {
  return cleanup();
});
//# sourceMappingURL=bootstrap.spec.js.map