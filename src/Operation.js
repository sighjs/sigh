import _ from 'lodash'
import Promise from 'bluebird'
import path from 'path'

import { UserError, rootErrorHandler } from './errors'
import Resource from './Resource'

var DEBOUNCE_MS = 200

export default class {
  constructor(func, nextOp) {
    this._func = func
    this._nextOp = nextOp
    this._resources = {}
  }

  get forWatch() {
    return this.inputs === 'watch'
  }
  get forBuild() {
    return this.inputs === 'build'
  }

  // ensure this is a source operation (one with no inputs)
  assertSource() {
    if (this.inputs instanceof Array)
      throw new UserError('expected operation to be source')
  }

  // Execute this operation with the given inputs.
  execute(inputs) {
    this.inputs = inputs
    return Promise.try(() => {
      return this._func(this)
    })
    .then(this._next.bind(this))
  }

  resource(filePath) {
    var fullPath = path.resolve(filePath);
    return this._resources[fullPath] || (this._resources[fullPath] = new Resource(filePath))
  }

  resources() {
      return _.values(this._resources)
  }

  removeResource(filePath) {
    var fullPath = path.resolve(filePath);
    delete this._resources[fullPath]
  }

  /// Trigger re-execution of the upstream pipeline asynchronously (e.g. due
  /// to a file change)
  /// @param inputs Array of resources to pass down the pipeline, if not passed
  ///               then all resources created with this.resource() are passed.
  next(resources) {
    if (! this._debounceNext)
      this._debounceNext = _.debounce(this._next.bind(this), DEBOUNCE_MS)

    Promise.try(this._debounceNext.bind(this, resources || this.resources())).catch(rootErrorHandler)
  }

  _next(inputs) {
    if (this._nextOp) {
      if (inputs === undefined)
        throw new UserError('sinks may only be at the end of a pipeline')

      return this._nextOp.execute(inputs.map(input => input.clone()))
    }
    else {
      return inputs
    }
  }
}
