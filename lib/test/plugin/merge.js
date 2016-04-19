'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _sighCore = require('sigh-core');

var _libPipelineCompiler = require('../../lib/PipelineCompiler');

var _libPipelineCompiler2 = _interopRequireDefault(_libPipelineCompiler);

var _libPluginMerge = require('../../lib/plugin/merge');

var _libPluginMerge2 = _interopRequireDefault(_libPluginMerge);

var _helper = require('./helper');

describe('merge plugin', function () {
  it('combines three streams into one', function () {
    var streams = [1, 2, 3].map(function (i) {
      return (0, _helper.plugin)(function (op) {
        return _sighCore.Bacon.constant([(0, _helper.makeEvent)(i)]);
      });
    });
    var opData = { compiler: new _libPipelineCompiler2['default']() };

    return _libPluginMerge2['default'].apply(undefined, [opData].concat(_toConsumableArray(streams))).then(function (streams) {
      var nEvents = 0;
      return new _bluebird2['default'](function (resolve, reject) {
        streams.onValue(function (events) {
          ++nEvents;
          events.length.should.equal(1);
          events[0].path.should.equal('file' + nEvents + '.js');
          if (nEvents === 3) {
            resolve();
            return _sighCore.Bacon.noMore;
          }
        });
      });
    });
  });

  it('assigns treeIndex to sub-operations', function () {
    var compiler = new _libPipelineCompiler2['default']();
    var opData = { compiler: compiler };
    var streams = [(0, _helper.plugin)(function (op) {
      return op.treeIndex.should.equal(1);
    }), (0, _helper.plugin)(function (op) {
      return op.treeIndex.should.equal(2);
    })];

    return compiler.compile([_helper.plugin.apply(undefined, [_libPluginMerge2['default']].concat(streams))]);
  });

  it('increments treeIndex for subsequent operations', function () {
    var compiler = new _libPipelineCompiler2['default']();
    var opData = { compiler: compiler };
    var streams = [(0, _helper.plugin)(function (op) {
      return 1;
    }), (0, _helper.plugin)(function (op) {
      return 2;
    })];

    return compiler.compile([_helper.plugin.apply(undefined, [_libPluginMerge2['default']].concat(streams)), (0, _helper.plugin)(function (op) {
      return op.treeIndex.should.equal(3);
    })]);
  });
});
//# sourceMappingURL=merge.js.map