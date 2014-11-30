// file root minus extension
export default function(outputFileRoot) {
  return operation => {
    console.log("concat: => %j", operation.inputs)
    operation.next([])
  }
}
