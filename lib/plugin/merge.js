'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _sighCore = require('sigh-core');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _sighCoreLibStream = require('sigh-core/lib/stream');

var DEFAULT_DEBOUNCE = 200;

exports['default'] = function (op) {
  for (var _len = arguments.length, pipelines = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    pipelines[_key - 1] = arguments[_key];
  }

  // Promise.map(..., { concurrency: 1 }) delivers the items to the iterator
  // out of order which messes with opTreeIndex ordering.
  return _bluebird2['default'].reduce(pipelines, function (streams, pipeline) {
    return op.compiler.compile(pipeline, op.stream || null).then(function (stream) {
      streams.push(stream);
      return streams;
    });
  }, []).then(function (streams) {
    return _sighCore.Bacon.mergeAll(streams.filter(function (stream) {
      return stream !== op.compiler.initStream;
    }));
  });
};

module.exports = exports['default'];
//# sourceMappingURL=merge.js.map