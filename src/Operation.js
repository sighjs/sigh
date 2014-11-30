import { UserError } from './errors'
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

  execute(inputs) {
    this.inputs = inputs
    return Promise.try(() => {
      return this._func(this)
    })
    .then(outputs => {
      if (this._nextOp) {
        if (outputs === undefined)
          throw new UserError('sinks may only be at the end of a pipeline')

        return this._nextOp.execute(outputs)
      }
      else if (outputs !== undefined) {
        throw new UserError('pipeline must end in a sink')
      }
    })
  }

  // ensure this is a source operation (one with no inputs)
  _enforceSource() {
    if (this.inputs instanceof Array)
      throw Error('expected operation to be source')
  }
}
