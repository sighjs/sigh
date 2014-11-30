export default function(outputDir) {
  return operation => {
    console.log("write: => %j", operation.inputs)
    operation.next()
  }
}
