import Promise from 'bluebird'

import { UserError, rootErrorHandler } from './errors'
import Resource from './Resource'

export default class {
  constructor(func, nextOp) {
    this._func = func
    this._nextOp = nextOp
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

  makeResource(filePath) {
    // TODO: cache it
    return new Resource(filePath)
  }

  // Trigger re-execution of the upstream pipeline asynchronously (e.g. due
  // to a file change)
  next(inputs) {
    Promise.try(this._next.bind(this, inputs)).catch(rootErrorHandler)
  }

  _next(inputs) {
    if (this._nextOp) {
      if (inputs === undefined)
        throw new UserError('sinks may only be at the end of a pipeline')

      return this._nextOp.execute(inputs)
    }
    else {
      return inputs
    }
  }
}
