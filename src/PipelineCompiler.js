import _ from 'lodash'
import Promise from 'bluebird'

export default class {
  /**
   * @param {Object} options Object containing the following fields:
   *  watch: {Booloean} Whether to pass "watch" to plugins (i.e. sigh -w was used).
   *  environment: {String} Environment being bulit (sigh -e env).
   *  treeIndex: {Number} treeIndex First tree index, defaulting to 1.
   */
  constructor(options) {
    if (! options)
      options = {}
    this.treeIndex = options.treeIndex || 1
    this.watch = options.watch
    this.environment = options.environment
    this.pipelines = options.pipelines ? _.clone(options.pipelines) : {}
  }

  /**
   * Turn a pipeline into a stream.
   * @param {Array} pipeline Array of operations representing pipeline.
   * @return {Bacon} stream that results from combining all operations in the pipeline.
   */
  compile(pipeline, inputStream = null, name = null) {
    var runOperation = (operation, opData) => {
      var stream = operation.plugin ?
        operation.plugin.apply(this, [ opData ].concat(operation.args)) :
        operation(opData)

      return Promise.resolve(stream).then(stream => {
        if (this.treeIndex === opData.treeIndex)
          ++this.treeIndex
        else if (opData.treeIndex > this.treeIndex)
          this.treeIndex = opData.treeIndex

        if (opData.cleanup) {
          // TODO: register pipeline cleanup function
        }

        return stream
      })
    }

    if (! (pipeline instanceof Array))
      pipeline = [ pipeline ]

    var { watch, environment } = this
    var streamPromise = Promise.reduce(pipeline, (stream, operation) => {
      var { treeIndex } = this
      return runOperation(operation, { stream, watch, treeIndex, compiler: this, environment })
    }, inputStream)

    return name ?
      streamPromise.then(stream => this.pipelines[name] = stream) :
      streamPromise
  }
}
