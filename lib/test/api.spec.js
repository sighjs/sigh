'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _PipelineCompiler = require('../PipelineCompiler');

var _PipelineCompiler2 = _interopRequireDefault(_PipelineCompiler);

var _api = require('../api');

var _rewire = require('rewire');

var _rewire2 = _interopRequireDefault(_rewire);

var copy = _bluebird2['default'].promisify(require('fs-extra').copy);
var mkTmpDir = _bluebird2['default'].promisify(require('temp').mkdir);

var FIXTURE_PATH = 'test/fixtures/sigh-project';

describe('loadPipelineDependencies', function () {
  var pipelinePlugin = require('../plugin/pipeline');
  var mergePlugin = require('../plugin/merge');
  var fakePlugin = {};

  var loadPipelineDependencies = (0, _rewire2['default'])('../api').__get__('loadPipelineDependencies');

  var makePluginDesc = function makePluginDesc(plugin) {
    var args = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];
    return { plugin: plugin, args: args };
  };

  var pipelines = {
    dep1: [makePluginDesc(fakePlugin, ['1'])],
    dep2: [makePluginDesc(fakePlugin, ['2'])]
  };

  it('should ignore pipeline activation in first leaf and detect subsequent activation', function () {
    var runPipelines = {
      main: [{ plugin: pipelinePlugin, args: [{ activate: true }, 'dep2'] }, { plugin: pipelinePlugin, args: [{ activate: true }, 'dep1'] }]
    };

    var deps = loadPipelineDependencies(runPipelines, pipelines);
    deps.should.have.property('dep1').and.equal(pipelines.dep1);
    deps.should.not.have.property('dep2');
  });

  it('should detect pipeline activation in merge, ignoring activation in first leaf node', function () {
    var runPipelines = {
      main: [makePluginDesc(mergePlugin, [{ plugin: pipelinePlugin, args: [{ activate: true }, 'dep2'] }, { plugin: pipelinePlugin, args: [{ activate: true }, 'dep1'] }])]
    };

    var deps = loadPipelineDependencies(runPipelines, pipelines);
    deps.should.have.property('dep1').and.equal(pipelines.dep1);
    deps.should.not.have.property('dep2');
  });
});

describe('compileSighFile', function () {
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