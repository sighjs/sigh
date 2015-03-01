var { readFileSync } = require('fs')

export default class {
  constructor(fields) {
    this.type = fields.type
    this.path = fields.path
    if (this.type !== 'remove')
      this.data = fields.data || readFileSync(this.path).toString()
    if (fields.baseDir)
      this.baseDir = fields.baseDir
  }

  get fileType() {
    return this.path.substring(this.path.lastIndexOf('.') + 1)
  }

  get supportsSourceMap() {
    var { fileType } = this
    return fileType === 'js' || fileType === 'css'
  }

  get projectPath() {
    if (! this.baseDir)
      return this.path

    return this.path.indexOf(this.baseDir) === 0 ?
      this.path.substr(this.baseDir.length + 1) : this.path
  }
}
