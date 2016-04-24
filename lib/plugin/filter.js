'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _sighCore = require('sigh-core');

exports['default'] = function (select, op) {
  for (var _len = arguments.length, filters = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    filters[_key - 2] = arguments[_key];
  }

  filters = _lodash2['default'].flatten(filters);

  return op.stream.flatMap(function (events) {
    // ensure initialisation events are forwarded
    if (events.length === 0) return [];

    events = events.filter(function (event) {
      return filters.some(function (filter) {
        for (var key in filter) {
          var keyFilter = filter[key];
          var value = event[key];
          if (keyFilter instanceof RegExp) {
            if (!keyFilter.test(value)) return true;
          } else if (keyFilter !== value) return true;
        }

        return false;
      }) ? !select : select;
    });

    return events.length === 0 ? _sighCore.Bacon.never() : events;
  });
};

module.exports = exports['default'];
//# sourceMappingURL=filter.js.map