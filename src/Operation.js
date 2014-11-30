import { UserError, rootErrorHandler } from './errors'
import Promise from 'bluebird'

export default class {
  constructor(func, nextOp) {
    this._func = func
    this._nextOp = nextOp
  }

  get forWatch() {
    this._enforceSource()
    return this.inputs === 'watch'
  }
  get forBuild() {
    this._enforceSource()
    return this.inputs === 'build'
  }

  // Execute this operation with the given inputs.
  execute(inputs) {
    this.inputs = inputs
    return Promise.try(() => {
      return this._func(this)
    })
    .then(this._next.bind(this))
  }

  // Trigger re-execution of the upstream pipeline asynchronously (e.g. due
  // to a file change)
  next(inputs) {
    Promise.try(this._next.bind(this, inputs)).catch(rootErrorHandler)
  }

  // A plugin can call this to execute the upstream pipe again
  _next(inputs) {
    if (this._nextOp) {
      if (inputs === undefined)
        throw new UserError('sinks may only be at the end of a pipeline')

      return this._nextOp.execute(inputs)
    }
    else if (inputs !== undefined) {
      throw new UserError('pipeline must end in a sink')
    }
  }

  // ensure this is a source operation (one with no inputs)
  _enforceSource() {
    if (this.inputs instanceof Array)
      throw Error('expected operation to be source')
  }
}
