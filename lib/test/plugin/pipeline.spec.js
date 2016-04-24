'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _sighCore = require('sigh-core');

var _PipelineCompiler = require('../../PipelineCompiler');

var _PipelineCompiler2 = _interopRequireDefault(_PipelineCompiler);

var _pluginPipeline = require('../../plugin/pipeline');

var _pluginPipeline2 = _interopRequireDefault(_pluginPipeline);

describe('pipeline plugin', function () {
  var compiler, stream;
  beforeEach(function () {
    compiler = new _PipelineCompiler2['default']();
    stream = compiler.initStream;
  });

  it('intercepts the end of two pipelines', function () {
    return _bluebird2['default'].all([1, 2].map(function (idx) {
      return compiler.compile(function (op) {
        return _sighCore.Bacon.constant(idx);
      }, null, 'stream' + idx);
    })).then(function (streams) {
      return new _bluebird2['default'](function (resolve, reject) {
        var nValues = 0;
        (0, _pluginPipeline2['default'])({ stream: stream, compiler: compiler }, 'stream1', 'stream2').onValue(function (events) {
          ++nValues;
          events.should.eql(nValues);

          if (nValues === 2) {
            resolve();
            return _sighCore.Bacon.noMore;
          }
        });
      });
    });
  });

  it('can subscribe to the same stream as another pipeline', function () {
    return _bluebird2['default'].all([1, 2].map(function (idx) {
      return compiler.compile(function (op) {
        return _sighCore.Bacon.constant(idx);
      }, null, 'stream' + idx);
    })).then(function (streams) {
      // this stops the pipelines from spitting out all the events into the first
      // subscriber, emulating how a true pipeline would work using async glob etc.
      compiler.streams = _lodash2['default'].mapValues(compiler.streams, function (stream) {
        return stream.delay(0);
      });

      return _bluebird2['default'].all([new _bluebird2['default'](function (resolve, reject) {
        var nValues = 0;
        (0, _pluginPipeline2['default'])({ stream: stream, compiler: compiler }, 'stream1', 'stream2').onValue(function (events) {
          ++nValues;
          events.should.equal(nValues);
          if (nValues === 2) {
            resolve();
            return _sighCore.Bacon.noMore;
          }
        });
      }), new _bluebird2['default'](function (resolve, reject) {
        (0, _pluginPipeline2['default'])({ stream: stream, compiler: compiler }, 'stream2').onValue(function (events) {
          events.should.equal(2);
          resolve();
          return _sighCore.Bacon.noMore;
        });
      })]);
    });
  });

  it('can subscribe to a pipeline before it has been compiled', function () {
    var pipelineOp = (0, _pluginPipeline2['default'])({ stream: stream, compiler: compiler }, 'stream');

    compiler.compile(function (op) {
      return _sighCore.Bacon.constant(1);
    }, null, 'stream').then(function (stream) {
      compiler.streams.stream = compiler.streams.stream.delay(0);
      return pipelineOp.toPromise(_bluebird2['default']);
    }).then(function (values) {
      values.should.eql(1);
    });
  });
});
//# sourceMappingURL=pipeline.spec.js.map