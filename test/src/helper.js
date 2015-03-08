export function plugin(plugin, ...args) {
  var ret = { plugin }
  if (args.length)
    ret.args = args
  return ret
}
