'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _sighCore = require('sigh-core');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _pluginGlob = require('../../plugin/glob');

var _pluginGlob2 = _interopRequireDefault(_pluginGlob);

var copy = _bluebird2['default'].promisify(require('fs-extra').copy);
var mkTmpDir = _bluebird2['default'].promisify(require('temp').mkdir);

var FIXTURE_PATH = 'test/fixtures/simple-project';
var FIXTURE_FILES = [FIXTURE_PATH + '/file1.js', FIXTURE_PATH + '/file2.js'];

describe('glob plugin', function () {
  var stream = _sighCore.Bacon.constant([]);

  it('globs a wildcard', function () {
    return (0, _pluginGlob2['default'])({ stream: stream }, FIXTURE_PATH + '/*.js').toPromise(_bluebird2['default']).then(function (updates) {
      updates.length.should.equal(2);
      _lodash2['default'].pluck(updates, 'projectPath').sort().should.eql(FIXTURE_FILES);
      updates.forEach(function (file) {
        file.initPhase.should.be['true'];
        file.type.should.equal('add');
        file.opTreeIndex.should.equal(1);
      });
    });
  });

  it('globs a wildcard and forwards initial input events', function () {
    var stream = _sighCore.Bacon.constant([new _sighCore.Event({
      type: 'add',
      path: 'blah.js',
      data: 'var blah'
    })]);

    return (0, _pluginGlob2['default'])({ stream: stream }, FIXTURE_PATH + '/*.js').toPromise(_bluebird2['default']).then(function (events) {
      events.length.should.equal(3);

      var updates = events.slice(1);
      _lodash2['default'].pluck(updates, 'projectPath').sort().should.eql(FIXTURE_FILES);
      updates.forEach(function (file) {
        file.initPhase.should.be['true'];
        file.type.should.equal('add');
        file.opTreeIndex.should.equal(1);
      });
    });
  });

  it('globs a wildcard using the basePath option', function () {
    var opData = { stream: stream, treeIndex: 4 };
    return (0, _pluginGlob2['default'])(opData, { basePath: FIXTURE_PATH }, '*.js').toPromise(_bluebird2['default']).then(function (updates) {
      opData.nextTreeIndex.should.equal(5);
      updates.length.should.equal(2);
      updates[0].projectPath.should.equal('file1.js');
      updates[1].projectPath.should.equal('file2.js');
    });
  });

  it('globs two wildcards', function () {
    var opData = { stream: stream, treeIndex: 1 };
    return (0, _pluginGlob2['default'])(opData, FIXTURE_PATH + '/*1.js', FIXTURE_PATH + '/*2.js').toPromise(_bluebird2['default']).then(function (updates) {
      opData.nextTreeIndex.should.equal(3);
      updates.length.should.equal(2);
      _lodash2['default'].pluck(updates, 'path').sort().should.eql(FIXTURE_FILES);
      updates[0].opTreeIndex.should.equal(1);
      updates[1].opTreeIndex.should.equal(2);
      updates.forEach(function (file) {
        file.type.should.equal('add');
      });
    });
  });

  it('detects changes to two files matching globbed pattern', function () {
    var tmpPath;
    return mkTmpDir({ dir: 'test/tmp', prefix: 'sigh-glob-test-' }).then(function (_tmpPath) {
      tmpPath = _tmpPath;
      return copy(FIXTURE_PATH, tmpPath);
    }).then(function () {
      return new _bluebird2['default'](function (resolve) {
        var nUpdates = 0;
        var files = [tmpPath + '/file1.js', tmpPath + '/file2.js'];
        (0, _pluginGlob2['default'])({ stream: stream, watch: true, treeIndex: 4 }, tmpPath + '/*.js').onValue(function (updates) {
          if (++nUpdates === 1) {
            updates.length.should.equal(2);
            _lodash2['default'].delay(_fs2['default'].appendFile, 50, files[0], 'var file1line2 = 24;\n');
            _lodash2['default'].delay(_fs2['default'].appendFile, 500, files[1], 'var file2line2 = 25;\n');
          } else {
            updates.should.eql([new _sighCore.Event({
              type: 'change',
              path: files[nUpdates - 2],
              initPhase: false,
              opTreeIndex: 4,
              createTime: updates[0].createTime
            })]);
            if (nUpdates === 3) {
              resolve();
              return _sighCore.Bacon.noMore;
            }
          }
        });
      });
    });
  });

  it('forwards subsequent input events along with file change events', function () {
    var delayedInputEvent = new _sighCore.Event({
      type: 'add',
      path: 'blah.js',
      data: 'var blah'
    });

    var twoStream = _sighCore.Bacon.mergeAll(stream, _sighCore.Bacon.later(400, [delayedInputEvent]));

    var tmpPath;
    return mkTmpDir({ dir: 'test/tmp', prefix: 'sigh-glob-test-' }).then(function (_tmpPath) {
      tmpPath = _tmpPath;
      return copy(FIXTURE_PATH, tmpPath);
    }).then(function () {
      return new _bluebird2['default'](function (resolve) {
        var nUpdates = 0;
        var updateFile = tmpPath + '/file1.js';
        (0, _pluginGlob2['default'])({ stream: twoStream, watch: true, treeIndex: 4 }, tmpPath + '/*.js').onValue(function (updates) {
          if (++nUpdates === 1) {
            updates.length.should.equal(2);
            _lodash2['default'].delay(_fs2['default'].appendFile, 50, updateFile, 'var file1line2 = 24;\n');
          } else if (nUpdates === 2) {
            updates.should.eql([new _sighCore.Event({
              type: 'change',
              path: updateFile,
              initPhase: false,
              opTreeIndex: 4,
              createTime: updates[0].createTime
            })]);
          } else {
            updates[0].should.equal(delayedInputEvent);
            resolve();
            return _sighCore.Bacon.noMore;
          }
        });
      });
    });
  });

  it('detects new file', function () {
    var tmpPath;
    return mkTmpDir({ dir: 'test/tmp', prefix: 'sigh-glob-test-2-' }).then(function (_tmpPath) {
      tmpPath = _tmpPath;
      return copy(FIXTURE_PATH, tmpPath);
    }).then(function () {
      var addedFile = tmpPath + '/added-file.js';
      return new _bluebird2['default'](function (resolve) {
        var nUpdates = 0;
        var files = [tmpPath + '/file1.js', tmpPath + '/file2.js'];
        (0, _pluginGlob2['default'])({ stream: stream, watch: true, treeIndex: 4 }, tmpPath + '/*.js').onValue(function (updates) {
          if (++nUpdates === 1) {
            updates.length.should.equal(2);
            _lodash2['default'].delay(_fs2['default'].writeFile, 300, addedFile, 'var file3line1 = 33;\n');
          } else {
            updates.should.eql([new _sighCore.Event({
              type: 'add',
              path: addedFile,
              initPhase: false,
              opTreeIndex: 4,
              createTime: updates[0].createTime
            })]);
            resolve();
            return _sighCore.Bacon.noMore;
          }
        });
      });
    });
  });

  xit('detects file unlink', function () {});

  xit('detects file rename', function () {});
});
//# sourceMappingURL=glob.spec.js.map