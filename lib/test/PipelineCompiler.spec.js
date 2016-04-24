'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _sighCore = require('sigh-core');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _PipelineCompiler = require('../PipelineCompiler');

var _PipelineCompiler2 = _interopRequireDefault(_PipelineCompiler);

var _pluginHelper = require('./plugin/helper');

var should = require('chai').should();

describe('PipelineCompiler', function () {
  it('should create appropriate stream from array', function () {
    var compiler = new _PipelineCompiler2['default']();
    return compiler.compile([function (op) {
      // TODO: test op.stream is Bacon.constant([])
      return _sighCore.Bacon.constant(1);
    }, function (op) {
      return op.stream.map(function (v) {
        return v + 1;
      });
    }]).then(function (stream) {
      return stream.toPromise(_bluebird2['default']).then(function (value) {
        return value.should.equal(2);
      });
    });
  });

  it('should create stream from stream, passing watch option', function () {
    var compiler = new _PipelineCompiler2['default']({ watch: true });
    return compiler.compile(function (op) {
      op.watch.should.be['true'];
      // TODO: test op.stream is Bacon.constant([])
      return _sighCore.Bacon.constant(420);
    }).then(function (stream) {
      return stream.toPromise(_bluebird2['default']).then(function (value) {
        return value.should.equal(420);
      });
    });
  });

  it('should pass arguments to plugin', function () {
    var compiler = new _PipelineCompiler2['default']();
    return compiler.compile((0, _pluginHelper.plugin)(function (op, arg1, arg2) {
      should.not.exist(op.watch);
      // TODO: test op.stream is Bacon.constant([])
      return _sighCore.Bacon.constant(arg1 + arg2);
    }, 7, 11)).then(function (stream) {
      return stream.toPromise(_bluebird2['default']).then(function (value) {
        return value.should.equal(18);
      });
    });
  });

  it('should pass treeIndex and observe nextTreeIndex', function () {
    var compiler = new _PipelineCompiler2['default']();
    return compiler.compile([function (op) {
      op.treeIndex.should.equal(1);
    }, function (op) {
      op.treeIndex.should.equal(2), op.treeIndex = 4;
    }, function (op) {
      op.treeIndex.should.equal(4);
    }]);
  });
});
//# sourceMappingURL=PipelineCompiler.spec.js.map