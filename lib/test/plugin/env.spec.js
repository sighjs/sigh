'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _sighCore = require('sigh-core');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _pluginEnv = require('../../plugin/env');

var _pluginEnv2 = _interopRequireDefault(_pluginEnv);

var _PipelineCompiler = require('../../PipelineCompiler');

var _PipelineCompiler2 = _interopRequireDefault(_PipelineCompiler);

var _helper = require('./helper');

describe('env plugin', function () {
  it('modifies stream when selected environment is chosen', function () {
    var compiler = new _PipelineCompiler2['default']({ environment: 'friend' });
    var streams = [function (op) {
      return _sighCore.Bacon.constant(8);
    }, (0, _helper.plugin)(_pluginEnv2['default'], function (op) {
      return op.stream.map(function (val) {
        return val * 2;
      });
    }, 'friend')];

    return compiler.compile(streams).then(function (stream) {
      return stream.toPromise(_bluebird2['default']).then(function (v) {
        v.should.equal(16);
      });
    });
  });

  it('passes stream through when selected environments are not chosen', function () {
    var compiler = new _PipelineCompiler2['default']({ environment: 'e1' });
    var streams = [function (op) {
      return _sighCore.Bacon.constant(9);
    }, (0, _helper.plugin)(_pluginEnv2['default'], function (op) {
      return op.stream.map(function (val) {
        return val * 2;
      });
    }, 'e2', 'e3')];

    return compiler.compile(streams).then(function (stream) {
      return stream.toPromise(_bluebird2['default']).then(function (v) {
        v.should.equal(9);
      });
    });
  });
});
//# sourceMappingURL=env.spec.js.map