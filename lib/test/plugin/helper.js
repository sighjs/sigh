'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.makeEvent = makeEvent;
exports.plugin = plugin;

var _sighCore = require('sigh-core');

function makeEvent(num) {
  var initPhase = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

  return new _sighCore.Event({
    path: 'file' + num + '.js',
    type: 'add',
    opTreeIndex: num,
    data: 'var a' + num + ' = ' + num,
    initPhase: initPhase
  });
}

function plugin(plugin) {
  var ret = { plugin: plugin };

  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  if (args.length) ret.args = args;
  return ret;
}
//# sourceMappingURL=helper.js.map