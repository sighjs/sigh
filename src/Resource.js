import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import Promise from 'bluebird'
import mercator from 'mercator'

var SourceMap = mercator.SourceMap

/**
 * @param {String} path The absolute or relative path to the resource
 * @param {String} type The type of resource (javascript, css, etc)
 * @param {String} map The source map.
 */
export default class Resource {
  constructor(filePath) {
    if (typeof filePath === 'object') {
      var other = filePath;
      _.assign(this, _.pick(other, 'filePath', 'fileName', 'type', 'data', '_map'))
    }
    else {
      this.setFilePath(filePath)
    }
  }

  setFilePath(filePath) {
    this.filePath = filePath
    this.fileName = path.basename(this.filePath)
    this.type = path.extname(this.fileName).slice(1)
  }

  // Return a promise that reads the resource from the filesystem.
  loadFromFs() {
    // TODO: also look for map
    return Promise.promisify(fs.readFile)(this.filePath).then(data => {
      this.data = data.toString()
      // this._map = SourceMap.forSource(this.data, path.resolve(this.filePath))
      return this
    })
  }

  // apply source map
  applyMap(map) {
    if (typeof map === 'string')
      map = JSON.parse(map)

    map = SourceMap.fromMapObject(map)

    if (this._map)
      this._map = this._map.apply(map)
    else
      this._map = map
  }

  get map() {
    if (! this._map)
      this._map = SourceMap.forSource(this.data, path.resolve(this.filePath))

    this.data = mercator.stripSourceMappingComment(this.data)
    return this._map
  }

  set map(map) {
    this._map = map
  }

  clone() {
    // TODO: also clone source map?
    return new Resource(this)
  }

  get sourceMapFileName() {
    return this.fileName + '.map'
  }

  /// Assign new properties to be merged in to current properties
  assign(props) {
    _.assign(this, props)

    if (! this.filePath)
      throw Error('Resource requires a path')

    this.fileName = path.basename(this.filePath)
  }
}
