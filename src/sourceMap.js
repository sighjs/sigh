import esprima from 'esprima'
import { SourceMapGenerator } from 'source-map'
import path from 'path'

/**
 * @param {Object} sourceMap Source map to apply onto.
 * @param {Object} applicator Source map to apply.
 * @return {Object} transformed source map
 */
export function apply(sourceMap, applicator) {
  // TODO: ...
  return applicator
}

/**
 * @param {Array} sourceMaps Array of source maps to concatenate.
 * @return {Object} Concatenated source maps
 */
export function concatenate(sourceMaps) {
  // TODO:
  return sourceMaps[0]
}

/**
 * @param {String} sourceType js/css
 * @param {String} sourcePath path to source file.
 * @return {Object} identity source map.
 */
export function generateIdentitySourceMap(sourceType, sourcePath, data) {
  if (sourceType === 'js') {
    var generator = new SourceMapGenerator({ file: path.basename(sourcePath) })
    var tokens = esprima.tokenize(data, { loc: true })
    tokens.forEach(function(token) {
      var loc = token.loc.start
      generator.addMapping({ generated: loc, original: loc, source: sourcePath })
    })
    return generator.toJSON()
  }
  else if (sourceType === 'css') {
    // TODO:
    return {}
  }
}
