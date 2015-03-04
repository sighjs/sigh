import _ from 'lodash'
var { Bacon } = require('baconjs')

import Event from '../lib/event'
import babel from '../lib/babel'

describe('babel plugin', () => {

  it('compiles a single add event', () => {
    var data = 'var pump = () => "pumper"'
    var stream = Bacon.once([ new Event({ path: 'subdir/file.js', type: 'add', data }) ])

    return babel(stream).toPromise().then(events => {
      events.length.should.equal(1)
      events[0].data.should.equal('define("subdir/file", ["exports"], function (exports) {\n  "use strict";\n\n  var pump = function () {\n    return "pumper";\n  };\n});')
    })
  })

})
