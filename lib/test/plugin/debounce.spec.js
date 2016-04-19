'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _sighCore = require('sigh-core');

var _PipelineCompiler = require('../../PipelineCompiler');

var _PipelineCompiler2 = _interopRequireDefault(_PipelineCompiler);

var _pluginDebounce = require('../../plugin/debounce');

var _pluginDebounce2 = _interopRequireDefault(_pluginDebounce);

var _helper = require('./helper');

describe('debounce plugin', function () {
  it('debounces two streams', function () {
    var streams = _sighCore.Bacon.fromArray([1, 2].map(function (idx) {
      return [(0, _helper.makeEvent)(idx, true)];
    }));
    var compiler = new _PipelineCompiler2['default']();
    var opData = { compiler: compiler };

    return compiler.compile([function (op) {
      return streams;
    }, (0, _helper.plugin)(_pluginDebounce2['default'], 100)]).then(function (streams) {
      return streams.toPromise(_bluebird2['default']);
    }).then(function (events) {
      events = events.sort();
      events[0].path.should.equal('file1.js');
      events.length.should.equal(2);
      events[1].path.should.equal('file2.js');
    });
  });
});
//# sourceMappingURL=debounce.spec.js.map