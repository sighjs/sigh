import Promise from 'bluebird'
import Bacon from 'baconjs'

import { mapEvents } from '../stream'

describe('stream api', () => {
  it('mapEvents intercepts errors', () => {
    return new Promise(function(resolve, reject) {
      var stream = mapEvents(
        Bacon.constant([1, 2, 3, 4]),
        v => v % 2 ? v : new Bacon.Error(v)
      ).delay(0)

      var nErrors = 0, nValues = 0
      var finish = () => { if (nErrors === 2 && nValues === 1) resolve() }

      stream.onError(err => {
        ++nErrors
        err.should.equal(nErrors * 2)
        finish()
      })

      stream.onValue(values => {
        ++nValues
        values.should.eql([1, 3])
        finish()
      })
    })
  })
})
