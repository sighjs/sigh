'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _sighCore = require('sigh-core');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _sighCoreLibStream = require('sigh-core/lib/stream');

exports['default'] = function (op) {
  for (var _len = arguments.length, pipelines = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    pipelines[_key - 1] = arguments[_key];
  }

  var collectInitial = false;
  if (pipelines.length && !pipelines[0].plugin) {
    var opts = pipelines.shift();
    collectInitial = opts.collectInitial;
  }

  // Promise.map(..., { concurrency: 1 }) delivers the items to the iterator
  // out of order which messes with opTreeIndex ordering.
  var streamPromise = _bluebird2['default'].reduce(pipelines, function (streams, pipeline) {
    return op.compiler.compile(pipeline, op.stream || null).then(function (stream) {
      streams.push(stream);
      return streams;
    });
  }, []).then(function (streams) {
    return _sighCore.Bacon.mergeAll(streams.filter(function (stream) {
      return stream !== op.compiler.initStream;
    }));
  });

  if (collectInitial) {
    return streamPromise.then(function (stream) {
      var initEvents = [];
      var nStreamEventsLeft = pipelines.length;

      return stream.flatMapLatest(function (events) {
        if (nStreamEventsLeft) {
          if (events.every(function (event) {
            return event.initPhase;
          })) {
            initEvents.push.apply(initEvents, _toConsumableArray(events));

            return --nStreamEventsLeft ? _sighCore.Bacon.mergeAll([_sighCore.Bacon.constant(initEvents), stream]) : _sighCore.Bacon.never();
          }
        } else {
          return events;
        }
      });
    });
  }

  return streamPromise;
};

module.exports = exports['default'];
//# sourceMappingURL=merge.js.map