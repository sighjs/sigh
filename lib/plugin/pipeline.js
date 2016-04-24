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
  for (var _len = arguments.length, pipelineNames = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    pipelineNames[_key - 1] = arguments[_key];
  }

  var compiler = op.compiler;

  pipelineNames = pipelineNames.filter(function (p) {
    return !p.hasOwnProperty('activate');
  });

  if (op.stream !== compiler.initStream) {
    pipelineNames.forEach(function (name) {
      // TODO: avoid forwarding []?
      compiler.addPipelineInput(name, op.stream.skipErrors());
    });
  }

  // during this call the streams may not be set up, wait until the first
  // "stream initialisation" value before merging the pipeline streams.
  return op.stream.take(1).flatMap(function (events) {
    return _sighCore.Bacon.mergeAll(_lodash2['default'].reduce(pipelineNames, function (streams, name) {
      var stream = compiler.streams[name];
      if (stream) streams.push(stream);
      return streams;
    }, [])).skipErrors();
  });
};

module.exports = exports['default'];
//# sourceMappingURL=pipeline.js.map