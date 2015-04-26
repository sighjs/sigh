import _ from 'lodash'
import Bacon from 'baconjs'
import Promise from 'bluebird'
import ProcessPool from 'process-pool'

var DEFAULT_JOBS = 4

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

    // compiled stream by pipeline name
    this.streams = {}

    this.initStream = Bacon.constant([])

    var processLimit = options.jobs || DEFAULT_JOBS
    // include sigh process as one job so subtract one
    // TODO: (processLimit > 0) when process-pools supports limit of 0
    if (processLimit > 1)
      --processLimit

    this.procPool = new ProcessPool({ processLimit })
  }

  /**
   * Clean up all allocated resources.
   */
  destroy() {
    this.procPool.destroy()
  }

  /**
   * Turn a pipeline into a stream.
   * @param {Array} pipeline Array of operations representing pipeline.
   * @return {Bacon} stream that results from combining all operations in the pipeline.
   */
  compile(pipeline, inputStream = null, name = null) {
    if (! inputStream)
      inputStream = this.initStream

    var compileOperation = (operation, opData) => {
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
      var { treeIndex, procPool } = this
      return compileOperation(operation, {
        stream,
        watch,
        treeIndex,
        procPool,
        compiler: this,
        environment,
        Bacon
      })
    }, inputStream)

    if (! name)
      return streamPromise

    return streamPromise.then(stream => {
      return this.streams[name] = stream
    })
  }
}
