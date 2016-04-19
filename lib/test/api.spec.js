'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _PipelineCompiler = require('../PipelineCompiler');

var _PipelineCompiler2 = _interopRequireDefault(_PipelineCompiler);

var _api = require('../api');

var copy = _bluebird2['default'].promisify(require('fs-extra').copy);
var mkTmpDir = _bluebird2['default'].promisify(require('temp').mkdir);

var FIXTURE_PATH = 'test/fixtures/sigh-project';

describe('api', function () {
  it('compile should build working bacon streams from pipelines in Sigh.js file', function () {
    this.timeout(3000);

    var pathBackup, compiler, tmpPath;

    return mkTmpDir({ dir: 'test/tmp', prefix: 'sigh-api-test-' }).then(function (_tmpPath) {
      tmpPath = _tmpPath;
      return copy(FIXTURE_PATH, tmpPath);
    }).then(function () {
      pathBackup = process.cwd();
      process.chdir(tmpPath);

      var opts = { environment: 'production' };
      compiler = new _PipelineCompiler2['default'](opts);
      return (0, _api.compileSighfile)(compiler, opts);
    }).then(function (streams) {
      return streams.js.toPromise(_bluebird2['default']);
    }).then(function (events) {
      events.length.should.equal(1);
      var event = events[0];
      event.path.should.equal('dist/combined.js');
    })['finally'](function () {
      compiler.destroy();
      if (pathBackup) process.chdir(pathBackup);
    });
  });
});
//# sourceMappingURL=api.spec.js.map