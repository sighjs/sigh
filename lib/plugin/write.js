'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.writeEvent = writeEvent;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _sighCore = require('sigh-core');

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _sighCoreLibStream = require('sigh-core/lib/stream');

var glob = _bluebird2['default'].promisify(require('glob'));

var writeFile = _bluebird2['default'].promisify(_fs2['default'].writeFile);
var unlink = _bluebird2['default'].promisify(_fs2['default'].unlink);
var rm = _bluebird2['default'].promisify(_fsExtra2['default'].remove); // TODO: not used yet, see later comment
var ensureDir = _bluebird2['default'].promisify(_fsExtra2['default'].ensureDir);

function writeEvent(basePath, event) {
  var fileType = event.fileType;

  var projectFile = _path2['default'].basename(event.path);
  var projectPath = event.projectPath;

  // the projectPath remains the same but the basePath is changed to point to
  // the output directory
  event.basePath = basePath;

  var outputPath = event.path;
  if (event.type === 'remove') {
    return unlink(outputPath).then(function () {
      return event.supportsSourceMap ? unlink(outputPath + '.map').then(function () {
        return event;
      }) : event;
    });
  }

  var data = event.data;

  var outputDir = _path2['default'].dirname(outputPath);

  var promise = ensureDir(_path2['default'].dirname(outputPath)).then(function () {
    return writeFile(outputPath, data);
  });

  if (event.supportsSourceMap) {
    var sourceMap;
    try {
      sourceMap = event.sourceMap;
    } catch (e) {
      _sighCore.log.warn('\x07could not construct identity source map for %s', projectPath);
      if (e.message) _sighCore.log.warn(e.message);
    }

    if (sourceMap) {
      var mapPath = projectFile + '.map';
      var suffix;
      if (fileType === 'js') suffix = '//# sourceMappingURL=' + mapPath;else if (fileType === 'css') suffix = '/*# sourceMappingURL=' + mapPath + ' */';

      if (suffix) data += '\n' + suffix;

      promise = promise.then(function () {
        if (sourceMap.sources) {
          sourceMap.sources = sourceMap.sources.map(function (source) {
            return _path2['default'].relative(outputDir, source);
          });
          return writeFile(_path2['default'].join(outputDir, mapPath), JSON.stringify(sourceMap));
        }
      });
    }
  }

  return promise.then(function () {
    return event;
  });
}

// basePath = base directory in which to write output files

exports['default'] = function (op, options, basePath) {
  if (!basePath) {
    basePath = options;
    options = {};
  }

  var clobberPromise;
  var _options = options;
  var clobber = _options.clobber;

  if (clobber) {
    // sanitize a path we are about to recursively remove... it must be below
    // the current working directory (which contains sigh.js)
    if (!basePath || basePath[0] === '/' || basePath.substr(0, 3) === '../') throw Error('refusing to clobber \'' + basePath + '\' outside of project');

    if (clobber === true) {
      clobberPromise = rm(basePath);
    } else {
      if (!(clobber instanceof Array)) clobber = [clobber];

      clobberPromise = _bluebird2['default'].map(clobber, function (pattern) {
        return glob(pattern, { cwd: basePath }).then(function (matches) {
          return _bluebird2['default'].map(matches, function (match) {
            return rm(_path2['default'].join(basePath, match));
          });
        });
      });
    }
  }

  var streamPromise = (0, _sighCoreLibStream.mapEvents)(op.stream, writeEvent.bind(this, basePath));
  return clobberPromise ? clobberPromise.thenReturn(streamPromise) : streamPromise;
};
//# sourceMappingURL=write.js.map