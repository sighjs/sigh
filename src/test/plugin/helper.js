import { Event } from 'sigh-core'

export function makeEvent(num, initPhase = false) {
  return new Event({
    path: `file${num}.js`,
    type: 'add',
    opTreeIndex: num,
    data: `var a${num} = ${num}`,
    initPhase
  })
}

export function plugin(plugin, ...args) {
  const ret = { plugin }
  if (args.length)
    ret.args = args
  return ret
}
