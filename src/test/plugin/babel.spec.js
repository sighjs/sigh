import _ from 'lodash'
import Promise from 'bluebird'
import Bacon from 'baconjs'
import ProcessPool from 'process-pool'

import Event from '../../Event'
import babel from '../../plugin/babel'

describe('babel plugin', () => {
  // TODO: use a single babel plugin for all tests to avoid all the delays due
  //       to starting subprocesses.
  var procPool
  beforeEach(() => {
    procPool = new ProcessPool
  })

  it('compiles a single add event', function() {
    this.timeout(2500)

    var data = 'var pump = () => "pumper"'
    var event = new Event({
      basePath: 'root',
      path: 'root/subdir/file.js',
      type: 'add',
      data
    })
    var stream = Bacon.once([ event ])

    return babel({ stream, procPool }).toPromise(Promise).then(events => {
      events.length.should.equal(1)

      var { data, sourceMap } = events[0]
      data.should.equal('define("subdir/file", ["exports"], function (exports) {\n  "use strict";\n\n  var pump = function () {\n    return "pumper";\n  };\n});')
      sourceMap.mappings.should.equal(';;;AAAA,MAAI,IAAI,GAAG;WAAM,QAAQ;GAAA,CAAA')
      sourceMap.file.should.equal(event.path)
    })
  })
})
