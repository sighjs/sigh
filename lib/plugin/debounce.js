'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _sighCore = require('sigh-core');

var _sighCoreLibStream = require('sigh-core/lib/stream');

exports['default'] = function (op) {
  var delay = arguments.length <= 1 || arguments[1] === undefined ? 500 : arguments[1];

  // return bufferingDebounce(op.stream, delay).map(_.flatten)

  var initPhase = true;
  var buffer = [];
  return op.stream.flatMapLatest(function (events) {
    // avoid buffering during file watch phase
    if (!initPhase) return events;

    if (events.some(function (event) {
      return !event.initPhase;
    })) {
      // glob found end of init phase
      initPhase = false;
      if (buffer.length) {
        events = buffer.concat(events);
        buffer.length = 0;
      }
      return events;
    }

    // TODO: coalesce events to reflect latest fs state
    buffer.push.apply(buffer, _toConsumableArray(events));

    // if another event is published then flatMapLatest unsubscribes from
    // the stream returned previously ensuring the splice doesn't happen.
    return _sighCore.Bacon.later(delay, buffer).map(function (buffer) {
      return buffer.splice(0);
    });
  });
};

module.exports = exports['default'];
//# sourceMappingURL=debounce.js.map