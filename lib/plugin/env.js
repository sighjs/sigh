'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

exports['default'] = function (op, pipeline) {
  for (var _len = arguments.length, envs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    envs[_key - 2] = arguments[_key];
  }

  envs = _lodash2['default'].flatten(envs);
  if (!_lodash2['default'].includes(envs, op.environment)) return op.stream;

  var compiled = op.compiler.compile(pipeline, op.stream);
  return compiled;
};

module.exports = exports['default'];
//# sourceMappingURL=env.js.map