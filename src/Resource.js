import _ from 'lodash'
import path from 'path'

/**
 * @param {String} path The absolute or relative path to the resource
 * @param {String} type The type of resource (javascript, css, etc)
 * @param {String} map The source map.
 */
export default class {
  constructor(props) {
    this.assign(_.assign({}, props, {
      // TODO: defaults go here
    }))
  }

  /// Assign new properties to be merged in to current properties
  assign(props) {
    _.assign(this, props)

    if (! this.path)
      throw Error('Resource requires a path')

    this.filename = path.basename(this.path)
  }
}
