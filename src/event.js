import { readFileSync } from 'fs'
import { apply as applySourceMap } from './sourceMap'

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
      this.data = fields.data !== undefined ? fields.data : readFileSync(this.path).toString()
    if (fields.basePath)
      this.basePath = fields.basePath
    if (fields.sourceMap) {
      this.sourceMap = fields.sourceMap
    }
    else {
      this.identitySourceMap = true
      // TODO: construct identity source map
    }
  }

  get fileType() {
    return this.path.substring(this.path.lastIndexOf('.') + 1)
  }

  applySourceMap(sourceMap) {
    if (this.identitySourceMap) {
      this.identitySourceMap = false
      this.sourceMap = sourceMap
    }
    else {
      this.sourceMap = applySourceMap(this.sourceMap, sourceMap)
    }
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
