'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _sighCore = require('sigh-core');

var _pluginConcat = require('../../plugin/concat');

var _pluginConcat2 = _interopRequireDefault(_pluginConcat);

var _sourceMap = require('source-map');

var _helper = require('./helper');

describe('concat plugin', function () {
  it('concatenates three javascript files', function () {
    var stream = _sighCore.Bacon.constant([1, 2, 3].map(function (num) {
      return (0, _helper.makeEvent)(num);
    }));

    return (0, _pluginConcat2['default'])({ stream: stream }, 'output.js', 10).toPromise(_bluebird2['default']).then(function (events) {
      events.length.should.equal(1);
      var _events$0 = events[0];
      var data = _events$0.data;
      var sourceMap = _events$0.sourceMap;

      data.should.equal('var a1 = 1\nvar a2 = 2\nvar a3 = 3\n');

      var consumer = new _sourceMap.SourceMapConsumer(sourceMap);
      var varPos = [1, 2, 3].map(function (line) {
        return consumer.originalPositionFor({ line: line, column: 0 });
      });
      varPos.forEach(function (pos, idx) {
        pos.line.should.equal(1);
        pos.source.should.equal('file' + (idx + 1) + '.js');
      });
    });
  });

  it('preserves treeIndex order', function () {
    var stream = _sighCore.Bacon.fromArray([[2, 1].map(function (num) {
      return (0, _helper.makeEvent)(num);
    })]);

    // first file in event array has higher tree index
    return (0, _pluginConcat2['default'])({ stream: stream }, 'output.js', 10).toPromise(_bluebird2['default']).then(function (events) {
      events[0].data.should.equal('var a1 = 1\nvar a2 = 2\n');
    });
  });

  it('should handle erroneous js file without sourcemap', function () {
    var data = "console.log('test)";

    var event = new _sighCore.Event({
      basePath: 'root',
      path: 'root/subdir/output.js',
      type: 'add',
      data: data
    });

    var stream = _sighCore.Bacon.constant([event]);

    return (0, _pluginConcat2['default'])({ stream: stream }).toPromise(_bluebird2['default']).then(function (events) {
      events[0]._sourceMap.sources.length.should.equal(0);
    });
  });

  xit('strips source map comments when concatenating two javascript files', function () {});
});
//# sourceMappingURL=concat.spec.js.map