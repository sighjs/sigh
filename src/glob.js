var patterns

function build(operation) {
  // TODO:
  console.log("glob build: => %j", operation.inputs)
  operation.next([])
}

function watch(operation) {
  console.log("glob watch: => %j", operation.inputs)
  // TODO:
  // operation.next([])
}

export default function(..._patterns) {
  patterns = _patterns

  return operation => {
    if (operation.forWatch) {
      watch(operation)
    }
    else if (operation.forBuild) {
      build(operation)
    }
  }
}
