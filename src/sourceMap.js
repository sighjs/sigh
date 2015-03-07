import esprima from 'esprima'
import { SourceMapGenerator, SourceMapConsumer } from 'source-map'
import path from 'path'

/**
 * @param {Object} sourceMap Source map to apply onto.
 * @param {Object} applicator Source map to apply.
 * @return {Object} transformed source map
 */
export function apply(sourceMap, applicator) {
  var cons = new SourceMapConsumer(sourceMap)
  var applCons = new SourceMapConsumer(applicator)

  var generator = SourceMapGenerator.fromSourceMap(applCons)
  generator.applySourceMap(cons, applicator.sources[0])

  return generator.toJSON()
}

/**
 * @param {Array} sourceMaps Array of source maps to concatenate.
 * @param {Array} offsets Contains the offset within the concatenated map for each source map (the array must be the same length as the sourceMaps parameter).
 * @return {Object} Concatenated source maps (you may wish to set the "file" property)
 */
export function concatenate(sourceMaps, offsets) {
  var generator = new SourceMapGenerator()
  var consumers = sourceMaps.map(sourceMap => new SourceMapConsumer(sourceMap))

  // TODO: look for content collisions in consumers?
  consumers.forEach((consumer, sourceMapIdx) => {
    consumer.sourcesContent.forEach((content, i) => {
      generator.setSourceContent(consumer.sources[i], content)
    })

    var offset = offsets[sourceMapIdx]
    consumer.eachMapping(mapping => {
      generator.addMapping({
          generated: {
              line: mapping.generatedLine + offset,
              column: mapping.generatedColumn
          },
          original: {
              line: mapping.originalLine,
              column: mapping.originalColumn
          },
          source: mapping.source,
          name: mapping.name
      })
    })
  })

  return generator.toJSON()
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

/**
 * Like indexOf but return source map style line/column data.
 * @return {Object} { line, column } of matching element or null if not found.
 */
export function positionOf(haystack, needle) {
  var index = haystack.indexOf(needle)
  if (index === -1)
    return null

  var line = 1, lineOffset = 0, nextLineOffset = haystack.indexOf('\n')
  for(;;) {
    if (nextLineOffset > index)
      break

    lineOffset = nextLineOffset
    ++line
    nextLineOffset = haystack.indexOf('\n', lineOffset + 1)
  }

  return { line, column: index - lineOffset - 1 } // first column is 0
}
