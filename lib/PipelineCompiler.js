'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _sighCore = require('sigh-core');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _processPool = require('process-pool');

var _processPool2 = _interopRequireDefault(_processPool);

var DEFAULT_JOBS = 4;

var _default = (function () {
  /**
   * @param {Object} options Object containing the following fields:
   *  watch: {Booloean} Whether to pass "watch" to plugins (i.e. sigh -w was used).
   *  environment: {String} Environment being bulit (sigh -e env).
   *  treeIndex: {Number} treeIndex First tree index, defaulting to 1.
   */

  function _default(options) {
    _classCallCheck(this, _default);

    if (!options) options = {};
    this.treeIndex = options.treeIndex || 1;
    this.watch = options.watch;
    this.environment = options.environment;

    // dependency name against array of input stream
    this.pipelineInputs = {};

    // compiled stream by pipeline name
    this.streams = {};

    this.initStream = _sighCore.Bacon.constant([]);

    var processLimit = options.jobs || DEFAULT_JOBS;
    // include sigh process as one job so subtract one
    // TODO: (processLimit > 0) when process-pools supports limit of 0
    if (processLimit > 1) --processLimit;

    this.procPool = new _processPool2['default']({ processLimit: processLimit });
  }

  _createClass(_default, [{
    key: 'addPipelineInput',
    value: function addPipelineInput(name, stream) {
      var pipelineInputs = this.pipelineInputs[name];
      if (pipelineInputs) pipelineInputs.push(stream);else this.pipelineInputs[name] = [stream];
    }

    /**
     * Clean up all allocated resources.
     */
  }, {
    key: 'destroy',
    value: function destroy() {
      this.procPool.destroy();
    }

    /**
     * Turn a pipeline into a stream.
     * @param {Array} pipeline Array of operations representing pipeline.
     * @return {Bacon} stream that results from combining all operations in the pipeline.
     */
  }, {
    key: 'compile',
    value: function compile(pipeline) {
      var _this = this;

      var inputStream = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
      var name = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

      if (name) {
        var pipelineInputs = this.pipelineInputs[name];
        if (pipelineInputs) {
          inputStream = _sighCore.Bacon.mergeAll(inputStream ? [inputStream].concat(_toConsumableArray(pipelineInputs)) : pipelineInputs);
        }
      }

      if (!inputStream) inputStream = this.initStream;

      var compileOperation = function compileOperation(operation, opData) {
        var stream = operation.plugin ? operation.plugin.apply(_this, [opData].concat(operation.args)) : operation(opData);

        return _bluebird2['default'].resolve(stream).then(function (stream) {
          if (_this.treeIndex === opData.treeIndex) ++_this.treeIndex;else if (opData.treeIndex > _this.treeIndex) _this.treeIndex = opData.treeIndex;

          if (opData.cleanup) {
            // TODO: register pipeline cleanup function
          }

          return stream;
        });
      };

      if (!(pipeline instanceof Array)) pipeline = [pipeline];

      var watch = this.watch;
      var environment = this.environment;

      var streamPromise = _bluebird2['default'].reduce(pipeline, function (stream, operation) {
        var treeIndex = _this.treeIndex;
        var procPool = _this.procPool;

        return compileOperation(operation, {
          stream: stream,
          watch: watch,
          treeIndex: treeIndex,
          procPool: procPool,
          compiler: _this,
          environment: environment
        });
      }, inputStream);

      if (!name) return streamPromise;

      return streamPromise.then(function (stream) {
        return _this.streams[name] = stream;
      });
    }
  }]);

  return _default;
})();

exports['default'] = _default;
module.exports = exports['default'];
//# sourceMappingURL=PipelineCompiler.js.map