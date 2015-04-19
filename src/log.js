import util from 'util'

var color = '\x1b[35m'
var clear = '\x1b[0m'

var log = (format, ...args) => {
  console.log(` ${color}*${clear} ${format}`, ...args)
}

log.warn = (format, ...args) => {
  console.warn(` ${color}!${clear} ${format}`, ...args)
}

export default log
