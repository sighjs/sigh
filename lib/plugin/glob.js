'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _chokidar = require('chokidar');

var _chokidar2 = _interopRequireDefault(_chokidar);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _sighCore = require('sigh-core');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _sighCoreLibStream = require('sigh-core/lib/stream');

// necessary to detect chokidar's duplicate/invalid events, see later comment

var glob = _bluebird2['default'].promisify(require('glob'));

var DEFAULT_DEBOUNCE = 120;

exports['default'] = function (op) {
  for (var _len = arguments.length, patterns = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    patterns[_key - 1] = arguments[_key];
  }

  // the first argument could be an option object rather than a pattern
  var opts = typeof patterns[0] === 'object' ? patterns.shift() : {};

  var _op$treeIndex = op.treeIndex;
  var treeIndex = _op$treeIndex === undefined ? 1 : _op$treeIndex;
  var _op$debounce = op.debounce;
  var debounce = _op$debounce === undefined ? DEFAULT_DEBOUNCE : _op$debounce;

  op.nextTreeIndex = treeIndex + patterns.length;

  var newEvent = function newEvent(type, _ref) {
    var path = _ref.path;
    var treeIndex = _ref.treeIndex;
    var _ref$initPhase = _ref.initPhase;
    var initPhase = _ref$initPhase === undefined ? false : _ref$initPhase;

    var props = { type: type, path: path, initPhase: initPhase, opTreeIndex: treeIndex };
    if (opts.basePath) props.basePath = opts.basePath;
    props.createTime = new Date();
    return new _sighCore.Event(props);
  };

  if (opts.basePath) patterns = patterns.map(function (pattern) {
    return opts.basePath + '/' + pattern;
  });

  var makeGlobStream = function makeGlobStream(events) {
    var stream = _sighCore.Bacon.combineAsArray(patterns.map(function (pattern, idx) {
      return _sighCore.Bacon.fromPromise(glob(pattern).then(function (paths) {
        return paths.map(function (path) {
          return { path: path, treeIndex: treeIndex + idx };
        });
      }));
    })).map(_lodash2['default'].flatten).map(function (files) {
      return events.concat(files.map(function (file) {
        file.initPhase = true;
        return newEvent('add', file);
      }));
    }).take(1);

    if (!op.watch) return stream;

    var watchers = patterns.map(function (pattern) {
      return _chokidar2['default'].watch(pattern, { ignoreInitial: true });
    });

    var chokEvRemap = { unlink: 'remove' };
    var updates = _sighCore.Bacon.mergeAll(_lodash2['default'].flatten(['add', 'change', 'unlink'].map(function (type) {
      return watchers.map(function (watcher, idx) {
        return _sighCore.Bacon.fromEvent(watcher, type).map(function (path) {
          // TODO: remove
          // console.log('watch', Date.now(), type, path)
          return [newEvent(chokEvRemap[type] || type, { path: path, treeIndex: treeIndex + idx })];
        });
      });
    })));

    // see https://github.com/paulmillr/chokidar/issues/262
    // the debounce alone makes chokidar behave but eventually coalesceEvents will
    // act as a second defense to this issue.
    return stream.changes().concat((0, _sighCoreLibStream.coalesceEvents)((0, _sighCoreLibStream.bufferingDebounce)(updates, debounce).map(_lodash2['default'].flatten)));
  };

  var globStream;
  return op.stream.flatMap(function (events) {
    if (!globStream) {
      globStream = makeGlobStream(events);
      return globStream;
    } else {
      return events;
    }
  });
};

module.exports = exports['default'];
//# sourceMappingURL=glob.js.map