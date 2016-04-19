'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _sighCore = require('sigh-core');

var _gulpUglify = require('gulp-uglify');

var _gulpUglify2 = _interopRequireDefault(_gulpUglify);

var _sourceMap = require('source-map');

var _sighCoreLibSourceMap = require('sigh-core/lib/sourceMap');

var _gulpAdapter = require('../gulp-adapter');

var _gulpAdapter2 = _interopRequireDefault(_gulpAdapter);

describe('gulp adapter', function () {
  it('adapts the gulp-uglify plugin', function () {
    var adapted = (0, _gulpAdapter2['default'])(_gulpUglify2['default']);

    var data = '  function hey() {\n  return    14 }\n\n  var a = 1';
    var stream = _sighCore.Bacon.constant([new _sighCore.Event({ path: 'file1.js', type: 'add', data: data })]);

    var op = adapted({ stream: stream });
    var nCalls = 0;

    op.onValue(function (events) {
      ++nCalls;
      events.length.should.equal(1);
      var event = events[0];
      var sizeReduction = data.length - event.data.length;
      // verify data is smaller (minified)
      sizeReduction.should.be.greaterThan(10);

      // verify the source map
      var consumer = new _sourceMap.SourceMapConsumer(event.sourceMap);
      var origPos = (0, _sighCoreLibSourceMap.positionOf)(data, 'var');
      origPos.should.eql({ line: 4, column: 2 });
      var transformedPos = (0, _sighCoreLibSourceMap.positionOf)(event.data, 'var');
      transformedPos.should.eql({ line: 1, column: 25 });
      var mappedPos = consumer.originalPositionFor(transformedPos);

      origPos.line.should.not.equal(transformedPos.line);
      origPos.line.should.equal(mappedPos.line);
      origPos.column.should.equal(mappedPos.column);
    });

    return new _bluebird2['default'](function (resolve) {
      op.onEnd(function () {
        nCalls.should.equal(1);
        resolve();
      });
    });
  });
});
//# sourceMappingURL=gulp-adapter.spec.js.map