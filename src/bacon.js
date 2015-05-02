// Bacon instances don't play well together, this allows something that consumes the
// sigh API to access the same instance of bacon that sigh uses.
module.exports = require('baconjs')
