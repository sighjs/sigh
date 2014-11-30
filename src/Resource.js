import _ from 'lodash'
import path from 'path'

/**
 * @param {String} path The absolute or relative path to the resource
 * @param {String} type The type of resource (javascript, css, etc)
 * @param {String} map The source map.
 */
export default class Resource {
  constructor(filePath) {
    if (typeof filePath === 'object') {
      var other = filePath;
      _.assign(this, _.pick(other, 'filePath', 'fileName'))
      return
    }

    this.filePath = filePath
    this.fileName = path.basename(this.filePath)
  }

  clone() {
    return new Resource(this)
  }

  /// Assign new properties to be merged in to current properties
  assign(props) {
    _.assign(this, props)

    if (! this.filePath)
      throw Error('Resource requires a path')

    this.fileName = path.basename(this.filePath)
  }
}
