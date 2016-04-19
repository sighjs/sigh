'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _vinyl = require('vinyl');

var _vinyl2 = _interopRequireDefault(_vinyl);

var _sighCore = require('sigh-core');

var _stream = require('stream');

exports['default'] = function (gulpPlugin) {
  return adapter.bind(null, gulpPlugin);
};

function adapter(gulpPlugin, op) {
  var sink;
  var gulpAdaptedStream = _sighCore.Bacon.fromBinder(function (_sink) {
    sink = _sink;
  });

  var onGulpValue = function onGulpValue(vinyl) {
    var source = vinyl.__source;

    if (!source) return new _sighCore.Bacon.Error('gulp plugin lost source, may not be compatible with sigh');

    source.data = vinyl.contents.toString();
    source.sourceMap = vinyl.sourceMap;

    sink([source]);
  };

  var gulpInStream = new _stream.Transform({ objectMode: true });

  for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  var gulpOutStream = gulpInStream.pipe(gulpPlugin.apply(undefined, args));
  gulpOutStream.on('data', onGulpValue);

  var registeredForEnd = false;

  var passThroughStream = op.stream.flatMap(function (events) {
    var passThroughEvents = [];
    events = events.filter(function (event) {
      if (event.type === 'change' || event.type === 'add') return true;
      passThroughEvents.push(event);
      return false;
    });

    if (events.length !== 0) {
      events.forEach(function (event) {
        var vinyl = new _vinyl2['default']({
          contents: new Buffer(event.data),
          path: event.path
        });

        // the next cannot be attached via the constructor
        // the following messes with source maps...
        // path: event.projectPath,
        // base: event.basePath,
        vinyl.sourceMap = event.sourceMap;

        // something to help...
        vinyl.__source = event;
        gulpInStream.push(vinyl);
      });
    }

    if (!registeredForEnd) {
      // delay until the first value to avoid starting stream during compilation stage
      op.stream.onEnd(function () {
        // without the nextTick then the last event can go missing on node 0.10
        process.nextTick(function () {
          gulpOutStream.removeListener('data', onGulpValue);
          sink(new _sighCore.Bacon.End());
        });
      });
      registeredForEnd = true;
    }

    return passThroughEvents.length === 0 ? _sighCore.Bacon.never() : passThroughEvents;
  });

  return _sighCore.Bacon.mergeAll(gulpAdaptedStream, passThroughStream);
}
module.exports = exports['default'];
//# sourceMappingURL=gulp-adapter.js.map