import { readFileSync } from 'fs'
import { apply as applySourceMap, generateIdentitySourceMap } from './sourceMap'

/**
 * Event passed through pipeline (which can be modified, concatenated, witheld etc. by any
 * pipeline operation), containing the following parameters:
 *   type: add/remove/change: Represents how the file has changed since it was last seen, the first event will always be an array containing an "add" of all files in the project.
 *   sourceData: data of first source-producing operation.
 *   sourcePath: path of first file producing operation.
 *   data: current data in event (possibly transformed one or more times).
 */
export default class {
  constructor(fields) {
    this.type = fields.type
    this.sourcePath = this.path = fields.path

    if (fields.opTreeIndex)
      this.opTreeIndex = fields.opTreeIndex

    if (fields.basePath)
      this.basePath = fields.basePath

    // setting the data here can also add a source map
    if (this.type === 'remove')
      return

    this.data = fields.data !== undefined ? fields.data : readFileSync(this.path).toString()
    this.sourceData = this.data

    if (fields.sourceMap)
      this.applySourceMap(fields.sourceMap)
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
    if (! this._sourceMap) {
      this._hasIdentitySourceMap = true
      this._sourceMap = generateIdentitySourceMap(this.fileType, this.sourcePath, this.data)
      this._sourceMap.sourcesContent = [ this.sourceData ]
    }

    return this._sourceMap
  }

  applySourceMap(sourceMap) {
    if (this._hasIdentitySourceMap) {
      this._sourceMap = null
      delete this._hasIdentitySourceMap
    }

    var { _sourceMap } = this
    if (! _sourceMap)
      this._sourceMap = sourceMap
    else
      this._sourceMap = applySourceMap(_sourceMap, sourceMap)
  }

  get supportsSourceMap() {
    var { fileType } = this
    return fileType === 'js' || fileType === 'css'
  }
}
