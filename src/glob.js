import chokidar from 'chokidar'
import glob from 'glob'
import _ from 'lodash'
var { Bacon } = require('baconjs'); // traceur :(

export default function(stream, watch, ...files) {
  if (stream !== null) {
    throw Error('glob must be the first operation in a pipeline')
  }

  stream = Bacon.combineAsArray(
    files.map(file => Bacon.fromNodeCallback(glob, file))
  )
  .map(_.flatten)
  .map(files => files.map(file => ({ type: 'add', path: file })))

  if (watch) {
    // TODO: add watching with chokidar after glob
  }

  return stream
}
