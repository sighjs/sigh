import { readFileSync } from 'fs'
import { apply as applySourceMap, generateIdentitySourceMap } from './sourceMap'

/**
 * Event passed through pipeline (which can be modified, concatenated, witheld etc. by any
 * pipeline operation), containing the following parameters:
 *   type: add/remove/change: Represents how the file has changed since it was last seen, the first event will always be an array containing an "add" of all files in the project.
 */
export default class {
  constructor(fields) {
    this.type = fields.type
    this.path = fields.path
    if (fields.opTreeIndex)
      this.opTreeIndex = fields.opTreeIndex

    // setting the data here can also add a source map
    if (this.type !== 'remove')
      this.data = fields.data !== undefined ? fields.data : readFileSync(this.path).toString()

    if (fields.basePath)
      this.basePath = fields.basePath

    if (fields.sourceMap) {
      this.applySourceMap(fields.sourceMap)
    }
  }

  // does this need to be a property?
  get projectPath() {
    if (! this.basePath)
      return this.path

    return this.path.indexOf(this.basePath) === 0 ?
      this.path.substr(this.basePath.length + 1) : this.path
  }

  set data(value) {
    this._data = value
    // TODO: strip/parse source map comment
  }
  get data() { return this._data }

  /**
   * @return {Number} The number of lines in the data
   */
  get lineCount() {
    // TODO: be more efficient
    return this.data.split('\n').length
  }

  get fileType() {
    return this.path.substring(this.path.lastIndexOf('.') + 1)
  }

  get sourceMap() {
    if (! this._sourceMap)
      this._sourceMap = generateIdentitySourceMap(this.fileType, this.path, this.data)

    return this._sourceMap
  }

  applySourceMap(sourceMap) {
    if (! this.sourceMap) {
      this._sourceMap = sourceMap
    }
    else {
      this._sourceMap = applySourceMap(this.sourceMap, sourceMap)
    }
  }

  get supportsSourceMap() {
    var { fileType } = this
    return fileType === 'js' || fileType === 'css'
  }
}
