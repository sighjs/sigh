export default function(...pipelines) {

  return operation => {
    console.log("all: => %j", operation.inputs)
    operation.next([])
  }
}
