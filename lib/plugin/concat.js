'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _sighCoreLibStream = require('sigh-core/lib/stream');

var _sighCoreLibSourceMap = require('sigh-core/lib/sourceMap');

var _sighCore = require('sigh-core');

exports['default'] = function (op, outputPath) {
  var fileExists = false;
  var maxCreateTime = new Date(-8640000000000000);

  return (0, _sighCoreLibStream.toFileSystemState)(op.stream).map(function (eventCache) {
    var data = '',
        sourceMaps = [];
    var offsets = [0],
        cumOffset = 0;
    var events = _lodash2['default'].sortBy(eventCache, 'opTreeIndex');

    // set this to the earliest new createTime after maxCreateTime
    var createTime = null;
    var nextMaxCreateTime = maxCreateTime;

    events.forEach(function (event, idx) {
      if (event.createTime > maxCreateTime) {
        if (event.createTime < createTime || createTime === null) createTime = event.createTime;

        if (event.createTime > nextMaxCreateTime) nextMaxCreateTime = event.createTime;
      }

      var offset = event.lineCount - 1;
      data += event.data;
      if (data[data.length - 1] !== '\n') {
        data += '\n';
        ++offset;
      }

      var sourceMap;
      try {
        sourceMap = event.sourceMap;
      } catch (e) {
        _sighCore.log.warn('\x07could not construct identity source map for %s', event.projectPath);
        if (e.message) _sighCore.log.warn(e.message);
      }

      if (sourceMap) {
        sourceMaps.push(sourceMap);
      }

      if (idx < events.length - 1) offsets.push(cumOffset += offset);
    });

    // is null when none of the creation times was greater than the previous
    if (createTime === null) createTime = maxCreateTime;

    maxCreateTime = nextMaxCreateTime;

    var sourceMap = (0, _sighCoreLibSourceMap.concatenate)(sourceMaps, offsets);
    sourceMap.file = outputPath;

    var ret = [new _sighCore.Event({
      type: fileExists ? 'change' : 'add',
      path: outputPath,
      data: data,
      sourceMap: sourceMap,
      createTime: createTime,
      initPhase: !events.some(function (event) {
        return !event.initPhase;
      })
    })];
    fileExists = true;
    return ret;
  });
};

module.exports = exports['default'];
//# sourceMappingURL=concat.js.map