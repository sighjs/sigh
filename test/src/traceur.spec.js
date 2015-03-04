import _ from 'lodash'
var { Bacon } = require('baconjs')

import Event from '../lib/event'
import traceur from '../lib/traceur'

describe('traceur plugin', () => {

  it.only('compiles a single add event', () => {
    var data = 'var pump = () => "pumper"'
    var stream = Bacon.once([ new Event({ path: 'subdir/file.js', type: 'add', data }) ])

    return traceur(stream).toPromise().then(events => {
      events.length.should.equal(1)
      // traceur... why you not generate a module name :(
      events[0].data.should.equal('define([], function() {\n  "use strict";\n  var pump = (function() {\n    return "pumper";\n  });\n  return {};\n});\n//# sourceMappingURL=file.js.map\n')
    })
  })

})
