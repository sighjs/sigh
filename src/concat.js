import _ from 'lodash'

function lineCount(source) {
    return source.split('\n').length;
}

export default function(outputFilePath) {
  return operation => {
    console.log("concat: => %j", operation.inputs)

    if (! operation.inputs.length)
      return []

    var concated = _.reduce(operation.inputs, (concated, resource) => {
      concated.map = concated.map.append(resource.map, lineCount(concated.data))
      concated.data += '\n' + resource.data
      return concated
    })

    concated.setFilePath(outputFilePath)
    return [concated]
  }
}
