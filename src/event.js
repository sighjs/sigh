import { readFileSync } from 'fs'

/**
 * Event passed through pipeline (which can be modified, concatenated, witheld etc. by any
 * pipeline operation), containing the following parameters:
 *   type: add/remove/change: Represents how the file has changed since it was last seen, the first event will always be an array containing an "add" of all files in the project.
 */
export default class {
  constructor(fields) {
    this.type = fields.type
    this.path = fields.path
    if (this.type !== 'remove')
      this.data = fields.data || readFileSync(this.path).toString()
    if (fields.basePath)
      this.basePath = fields.basePath
  }

  get fileType() {
    return this.path.substring(this.path.lastIndexOf('.') + 1)
  }

  applySourceMap(sourceMap) {
    if (this.sourceMap) {
      // TODO: apply source map
    }
    // else {
    this.sourceMap = sourceMap
    // }
  }

  get supportsSourceMap() {
    var { fileType } = this
    return fileType === 'js' || fileType === 'css'
  }

  get projectPath() {
    if (! this.basePath)
      return this.path

    return this.path.indexOf(this.basePath) === 0 ?
      this.path.substr(this.basePath.length + 1) : this.path
  }
}
