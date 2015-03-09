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
  }

  /**
   * Turn a pipeline into a stream.
   * @param {Array} pipeline Array of operations representing pipeline.
   * @return {Bacon} stream that results from combining all operations in the pipeline.
   */
  compile(pipeline, inputStream = null) {
    var runOperation = (operation, opData) => {
      var stream = operation.plugin.apply(this, [ opData ].concat(operation.args))
      return Promise.resolve(stream).then(stream => {
        if (this.treeIndex === opData.treeIndex)
          ++this.treeIndex
        else if (opData.treeIndex > this.treeIndex)
          this.treeIndex = opData.treeIndex

        return stream
      })
    }

    var multipleOps = pipeline instanceof Array
    var firstOp = multipleOps ? pipeline.shift() : pipeline
    var { watch, treeIndex, environment } = this
    var stream = runOperation(firstOp, {
      stream: inputStream,
      watch,
      treeIndex,
      compiler: this,
      environment
    })

    if (! multipleOps)
      return Promise.resolve(stream)

    return Promise.reduce(pipeline, (stream, operation) => {
      var { watch, treeIndex } = this
      return runOperation(operation, { stream, watch, treeIndex, compiler: this, environment })
    }, stream)
  }
}
