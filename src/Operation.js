import UserError from './errors'

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

  event() {
    this._func(this)
  }

  next(outputs) {
    this._nextOp.inputs = outputs
    this._nextOp.event()
  }

  // ensure this is a source operation (i.e. one with no inputs)
  _enforceSource() {
    if (this.inputs instanceof Array)
      throw Error('expected operation to be source')
  }
}
