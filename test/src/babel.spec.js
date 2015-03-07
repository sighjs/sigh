import _ from 'lodash'
import Bacon from 'baconjs'

import Event from '../lib/event'
import babel from '../lib/plugin/babel'

require('chai').should()

describe('babel plugin', () => {
  it('compiles a single add event', () => {
    var data = 'var pump = () => "pumper"'
    var event = new Event({
      basePath: 'root',
      path: 'root/subdir/file.js',
      type: 'add',
      data
    })
    var stream = Bacon.once([ event ])

    return babel({ stream }).toPromise().then(events => {
      events.length.should.equal(1)

      var { data, sourceMap } = events[0]
      data.should.equal('define("subdir/file", ["exports"], function (exports) {\n  "use strict";\n\n  var pump = function () {\n    return "pumper";\n  };\n});')
      sourceMap.mappings.should.equal(';;;AAAA,MAAI,IAAI,GAAG;WAAM,QAAQ;GAAA,CAAA')
      sourceMap.file.should.equal(event.path)
      sourceMap.sourceRoot.should.equal(event.basePath)
    })
  })

})
