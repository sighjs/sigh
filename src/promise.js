// argument forwarding promise delay
export function delay(ms, arg) {
  var deferred = Promise.pending()
  setTimeout(() => deferred.fulfill(arg), ms)
  return deferred.promise;
}
