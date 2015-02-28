import chokidar from 'chokidar'

export default function(stream, opts) {
  if (stream !== null) {
    throw Error('glob must be the first element in a pipeline')
  }

  if (opts.watch) {
  }
  else {
  }

  return stream
}
