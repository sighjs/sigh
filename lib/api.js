'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.invoke = invoke;
exports.compileSighfile = compileSighfile;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _rewire = require('rewire');

var _rewire2 = _interopRequireDefault(_rewire);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _processPoolLibFunctionLimit = require('process-pool/lib/functionLimit');

var _processPoolLibFunctionLimit2 = _interopRequireDefault(_processPoolLibFunctionLimit);

var _sighCore = require('sigh-core');

var _PipelineCompiler = require('./PipelineCompiler');

var _PipelineCompiler2 = _interopRequireDefault(_PipelineCompiler);

var _gulpAdapter = require('./gulp-adapter');

var _gulpAdapter2 = _interopRequireDefault(_gulpAdapter);

var _pluginMerge = require('./plugin/merge');

var _pluginMerge2 = _interopRequireDefault(_pluginMerge);

var _pluginConcat = require('./plugin/concat');

var _pluginConcat2 = _interopRequireDefault(_pluginConcat);

var _pluginDebounce = require('./plugin/debounce');

var _pluginDebounce2 = _interopRequireDefault(_pluginDebounce);

var _pluginEnv = require('./plugin/env');

var _pluginEnv2 = _interopRequireDefault(_pluginEnv);

var _pluginGlob = require('./plugin/glob');

var _pluginGlob2 = _interopRequireDefault(_pluginGlob);

var _pluginPipeline = require('./plugin/pipeline');

var _pluginPipeline2 = _interopRequireDefault(_pluginPipeline);

var _pluginWrite = require('./plugin/write');

var _pluginWrite2 = _interopRequireDefault(_pluginWrite);

var _pluginFilter = require('./plugin/filter');

var _pluginFilter2 = _interopRequireDefault(_pluginFilter);

var plugins = {
  merge: _pluginMerge2['default'], concat: _pluginConcat2['default'], debounce: _pluginDebounce2['default'], env: _pluginEnv2['default'], glob: _pluginGlob2['default'], pipeline: _pluginPipeline2['default'], write: _pluginWrite2['default'],
  select: _pluginFilter2['default'].bind(null, true),
  reject: _pluginFilter2['default'].bind(null, false)
};

/**
 * Run Sigh.js
 * @return {Promise} Resolves to an object { pipelineName: baconStream }
 */

function invoke() {
  var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  try {
    var exitCode = 0;
    var streams;
    var compiler = new _PipelineCompiler2['default'](opts);

    var startTime = Date.now();
    var relTime = function relTime() {
      var time = arguments.length <= 0 || arguments[0] === undefined ? startTime : arguments[0];
      return ((Date.now() - time) / 1000).toFixed(3);
    };

    return compileSighfile(compiler, opts).then(function (_streams) {
      streams = _streams;

      if (opts.verbose) (0, _sighCore.log)('waiting for subprocesses to start');
      return compiler.procPool.ready();
    }).then(function () {
      if (opts.verbose) (0, _sighCore.log)('subprocesses started in %s seconds', relTime());
      var pipeStartTime = Date.now();

      _lodash2['default'].forEach(streams, function (stream, pipelineName) {
        stream.onValue(function (events) {
          var now = new Date();

          var createTime = _lodash2['default'].min(events, 'createTime').createTime;
          var timeDuration = relTime(createTime ? createTime.getTime() : pipeStartTime);

          (0, _sighCore.log)('pipeline %s complete: %s seconds', pipelineName, timeDuration);
          if (opts.verbose > 1) {
            events.forEach(function (event) {
              var path = event.path;
              var projectPath = event.projectPath;

              var suffix = path !== projectPath ? ' [' + event.projectPath + ']' : '';
              _sighCore.log.nested(event.type + ' ' + event.path + suffix);
            });
          }
        });

        stream.onError(function (error) {
          exitCode = 1;
          _sighCore.log.warn('\x07error: pipeline %s', pipelineName);
          _sighCore.log.warn(error);
        });
      });

      _sighCore.Bacon.mergeAll(_lodash2['default'].values(streams)).onEnd(function () {
        if (opts.verbose) (0, _sighCore.log)('pipeline(s) complete: %s seconds', relTime());
        compiler.destroy();

        process.exit(exitCode);
      });
    });
  } catch (e) {
    if (typeof e === 'function' && e instanceof Error) {
      _sighCore.log.warn(e.message);
      process.exit(1);
    } else {
      throw e;
    }
  }
}

/**
 * Compile the Sigh.js file in the current directory with the given options.
 * @return {Promise} Resolves to an object { pipelineName: baconStream }
 */

function compileSighfile(compiler) {
  var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  try {
    var packageJson = JSON.parse(_fs2['default'].readFileSync('package.json'));
  } catch (e) {}

  var notPlugin = { 'sigh-cli': true, 'sigh-core': true };

  if (packageJson) {
    [packageJson.devDependencies, packageJson.dependencies].forEach(function (deps) {
      if (!deps) return;

      _lodash2['default'].forEach(deps, function (version, pkg) {
        if (notPlugin[pkg]) return;

        if (/^sigh-/.test(pkg)) {
          plugins[pkg.substr(5)] = require(_path2['default'].join(process.cwd(), 'node_modules', pkg));
        } else if (/^gulp-/.test(pkg)) {
          var name = pkg.substr(5);
          if (!plugins[name]) plugins[name] = (0, _gulpAdapter2['default'])(require(_path2['default'].join(process.cwd(), 'node_modules', pkg)));
        }
      });
    });
  }

  var sighPath;
  try {
    sighPath = require.resolve(_path2['default'].join(process.cwd(), 'Sigh'));
  } catch (e) {
    sighPath = require.resolve(_path2['default'].join(process.cwd(), 'sigh'));
  }

  var sighModule = (0, _rewire2['default'])(sighPath);
  _lodash2['default'].forEach(plugins, function (plugin, key) {
    return injectPlugin(sighModule, key);
  });

  var pipelines = { alias: {}, explicit: {} };
  sighModule(pipelines);

  var selectedPipelines = selectPipelines(opts.pipelines, pipelines);
  var runPipelines = loadPipelineDependencies(selectedPipelines, pipelines);

  if (opts.verbose) {
    (0, _sighCore.log)('running pipelines [ %s ] with %s jobs', Object.keys(runPipelines).join(', '), opts.jobs);
  }

  // to ensure the promises run one after the other so that plugins load
  // in dependency order, ideally they could be segmented according to
  // dependencies and loaded in several asynchronous batches.
  var limiter = (0, _processPoolLibFunctionLimit2['default'])(function (func) {
    return func();
  }, 1);

  return _bluebird2['default'].props(_lodash2['default'].mapValues(runPipelines, function (pipeline, name) {
    return limiter(function () {
      // This ensures that user selected pipeline's input streams are
      // merged with the init stream.
      var inputStream = selectedPipelines[name] ? compiler.initStream : null;
      return compiler.compile(pipeline, inputStream, name);
    });
  }));
}

/**
 * Select pipelines, then _.assign(pipelines, pipelines.explicit) ; delete pipelines.explicit
 * @param {Object} pipelines All pipelines by name and two extra keys, alias and explicit.
 *                           After this function returns the explicit pipelines will be
 *                           merged with the main pipelines and then the key will be deleted.
 * @return {Object} Pipeline name against pipeline in the order the user selected them.
 */
function selectPipelines(selected, pipelines) {
  if (!selected || selected.length === 0) selected = Object.keys(_lodash2['default'].omit(pipelines, 'alias', 'explicit'));

  if (!_lodash2['default'].isEmpty(pipelines.alias)) {
    selected = _lodash2['default'].flatten(selected.map(function (pipelineName) {
      return pipelines.alias[pipelineName] || pipelineName;
    }));
  }

  _lodash2['default'].defaults(pipelines, pipelines.explicit);
  delete pipelines.explicit;

  var runPipelines = {};
  selected.forEach(function (name) {
    runPipelines[name] = pipelines[name];
  });

  return runPipelines;
}

/**
 * Reverse the order of keys in a hash.
 * Works in any JS VM that maintains key insertion order.
 */
function reverseHash(hash) {
  var ret = {};
  Object.keys(hash).reverse().forEach(function (key) {
    ret[key] = hash[key];
  });
  return ret;
}

/**
 * @arg {Object} runPipelines A map of pipelines the user has chosen to run by name.
 * @arg {Object} pipelines A map of all pipelines by name.
 * @return {Object} A map of pipelines that should be run with dependents after dependencies.
 */
function loadPipelineDependencies(runPipelines, pipelines) {
  var ret = {};
  var loading = {};

  var loadDeps = function loadDeps(srcPipelines) {
    _lodash2['default'].forEach(srcPipelines, function (pipeline, name) {
      if (ret.name) return;else if (loading.name) throw Error('circular dependency from pipeline ' + name);

      loading[name] = true;

      // TODO: also cursively scan args, e.g. if used in merge
      var activations = [];

      // ignore pipelines in the first position as they only provide output, not
      // input and this can be associated dynamically through a flatMap
      // TODO: if this pipeline itself has input then the above comment no
      //       longer applies.
      var skipNextLeaf = true;

      var scanPipelineForActivation = function scanPipelineForActivation(pipeline) {
        pipeline.forEach(function (pluginMeta) {
          if (pluginMeta.plugin === plugins.merge) {
            scanPipelineForActivation(pluginMeta.args);
            return;
          }

          if (skipNextLeaf) {
            skipNextLeaf = false;
            return;
          }

          if (pluginMeta.plugin === plugins.pipeline) {
            var activateState = false;
            pluginMeta.args.forEach(function (arg) {
              if (arg.hasOwnProperty('activate')) activateState = arg.activate;else if (activateState) activations.push(arg);
            });
          }
        });
      };

      scanPipelineForActivation(pipeline);

      activations.forEach(function (activation) {
        var activationPipeline = pipelines[activation];
        if (!activationPipeline) throw Error('invalid pipeline ' + activation);

        ret[activation] = activationPipeline;
      });

      // this pipeline must come after those it activates so that
      // the dependency order is preserved after the list is reserved.
      ret[name] = pipeline;

      delete loading[name];
    });
  };

  loadDeps(reverseHash(runPipelines));

  return reverseHash(ret);
}

function injectPlugin(module, pluginName) {
  var plugin = plugins[pluginName];
  if (!plugin) throw new Error("Nonexistent plugin `" + pluginName + "'");

  try {
    var varName = _lodash2['default'].camelCase(pluginName);

    module.__set__(varName, function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return { plugin: plugin, args: args };
    });
  } catch (e) {
    // plugin not used
  }
}
//# sourceMappingURL=api.js.map