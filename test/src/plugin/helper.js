import Event from '../../lib/Event'

export function makeEvent(num) {
  return new Event({
    path: `file${num}.js`,
    type: 'add',
    opTreeIndex: num,
    data: `var a${num} = ${num}`
  })
}

export function plugin(plugin, ...args) {
  var ret = { plugin }
  if (args.length)
    ret.args = args
  return ret
}
