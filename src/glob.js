var patterns

function build(operation) {
  console.log("glob build: => %j", operation.inputs)
  // TODO:
  return []
}

function watch(operation) {
  console.log("glob watch: => %j", operation.inputs)
  // TODO:
  return []
}

export default function(..._patterns) {
  patterns = _patterns

  return operation => {
    if (operation.forWatch) {
      return watch(operation)
    }
    else if (operation.forBuild) {
      return build(operation)
    }
  }
}
