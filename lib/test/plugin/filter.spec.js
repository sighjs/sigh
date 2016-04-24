'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _sighCore = require('sigh-core');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _pluginFilter = require('../../plugin/filter');

var _pluginFilter2 = _interopRequireDefault(_pluginFilter);

var _PipelineCompiler = require('../../PipelineCompiler');

var _PipelineCompiler2 = _interopRequireDefault(_PipelineCompiler);

var _helper = require('./helper');

describe('filter plugin', function () {
  it('filters events according to a projectPath regex filter', function () {
    var events = [new _sighCore.Event({ type: 'add', path: 'blah.js', data: 'var blah' }), new _sighCore.Event({ type: 'add', path: 'plah.js', data: 'var plah' })];
    var stream = _sighCore.Bacon.constant(events);

    return (0, _pluginFilter2['default'])(true, { stream: stream }, { projectPath: /^b/ }).toPromise(_bluebird2['default']).then(function (events) {
      events.length.should.equal(1);
      events[0].projectPath.should.equal('blah.js');
    });
  });

  it('filters events according to a type string filter', function () {
    var events = [new _sighCore.Event({ type: 'add', path: 'blah.js', data: 'var blah' }), new _sighCore.Event({ type: 'update', path: 'plah.js', data: 'var plah' })];
    var stream = _sighCore.Bacon.constant(events);

    return (0, _pluginFilter2['default'])(true, { stream: stream }, { type: 'add' }).toPromise(_bluebird2['default']).then(function (events) {
      events.length.should.equal(1);
      events[0].projectPath.should.equal('blah.js');
    });
  });
});
//# sourceMappingURL=filter.spec.js.map