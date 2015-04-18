import util from 'util'

var log = (format, ...args) => {
  console.log(' \x1b[35m*\x1b[0m ' + format, ...args)
}

log.warn = (format, ...args) => {
  console.warn(format, ...args)
}

export default log
