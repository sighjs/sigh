var { readFileSync } = require('fs')

export default class {
  constructor(fields) {
    this.type = fields.type
    this.path = fields.path
    if (this.type !== 'remove')
      this.data = fields.data || readFileSync(this.path).toString()
  }

  get fileType() {
    return this.path.substring(this.path.lastIndexOf('.') + 1)
  }
}
