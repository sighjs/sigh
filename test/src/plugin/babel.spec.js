import _ from 'lodash'
import Promise from 'bluebird'
import Bacon from 'baconjs'

import Event from '../../lib/Event'
import babel from '../../lib/plugin/babel'

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

    return babel({ stream }).toPromise(Promise).then(events => {
      events.length.should.equal(1)

      var { data, sourceMap } = events[0]
      data.should.equal('define("subdir/file", ["exports"], function (exports) {\n  "use strict";\n\n  var pump = function () {\n    return "pumper";\n  };\n});')
      sourceMap.mappings.should.equal(';;;AAAA,MAAI,IAAI,GAAG;WAAM,QAAQ;GAAA,CAAA')
      sourceMap.file.should.equal(event.path)
    })
  })

})
