'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _sighCore = require('sigh-core');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _fs = require('fs');

var _pluginWrite = require('../../plugin/write');

var _pluginWrite2 = _interopRequireDefault(_pluginWrite);

var TMP_PATH = 'test/tmp/write';
var PROJ_PATH = 'subdir/file1.js';
var TMP_FILE = TMP_PATH + '/' + PROJ_PATH;

describe('write plugin', function () {
  it('writes a single file with no map to output directory with identity map', function () {
    var data = 'var pump\n';
    var stream = _sighCore.Bacon.constant([new _sighCore.Event({ path: PROJ_PATH, type: 'add', data: data })]);

    return (0, _pluginWrite2['default'])({ stream: stream }, TMP_PATH).toPromise(_bluebird2['default']).then(function (events) {
      // console.log('write events %j', events)
      (0, _fs.readFileSync)(TMP_FILE).toString().should.equal(data + '\n//# sourceMappingURL=file1.js.map');

      (0, _fs.readFileSync)(TMP_FILE + '.map').toString().should.equal('{"version":3,"sources":["../../../../subdir/file1.js"],"names":[],"mappings":"AAAA,IAAI","file":"file1.js","sourcesContent":["var pump\\n"]}');
    });
  });

  it('write a single file containing a basePath', function () {
    var data = 'var  pumpbaby\n';
    var stream = _sighCore.Bacon.constant([new _sighCore.Event({ basePath: 'subdir', path: PROJ_PATH, type: 'add', data: data })]);

    return (0, _pluginWrite2['default'])({ stream: stream }, TMP_PATH).toPromise(_bluebird2['default']).then(function (events) {
      // subdir stripped from the output path due to basePath
      var tmpFile = TMP_PATH + '/file1.js';

      (0, _fs.readFileSync)(tmpFile).toString().should.equal(data + '\n//# sourceMappingURL=file1.js.map');

      (0, _fs.readFileSync)(tmpFile + '.map').toString().should.equal('{"version":3,"sources":["../../../subdir/file1.js"],"names":[],"mappings":"AAAA,KAAK","file":"file1.js","sourcesContent":["var  pumpbaby\\n"]}');
    });
  });

  it('write a single file then remove it', function () {
    var data = 'var mew\n';
    var stream = _sighCore.Bacon.fromArray([[new _sighCore.Event({ path: PROJ_PATH, type: 'add', data: data })], [new _sighCore.Event({ path: PROJ_PATH, type: 'remove', data: data })]]);

    return new _bluebird2['default'](function (resolve, reject) {
      var nValues = 0;
      var writeStream = (0, _pluginWrite2['default'])({ stream: stream }, TMP_PATH);

      writeStream.onValue(function (events) {
        // console.log('write events %j', events)
        if (++nValues === 1) {
          (0, _fs.existsSync)(TMP_FILE).should.be.ok;
          (0, _fs.existsSync)(TMP_FILE + '.map').should.be.ok;
        } else {
          (0, _fs.existsSync)(TMP_FILE).should.not.be.ok;
          (0, _fs.existsSync)(TMP_FILE + '.map').should.not.be.ok;
          resolve();
          return _sighCore.Bacon.noMore;
        }
      });
      writeStream.onError(reject);
    });
  });
});
//# sourceMappingURL=write.spec.js.map