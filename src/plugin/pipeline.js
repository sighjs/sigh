import Promise from 'bluebird'
import Bacon from 'baconjs'
import _ from 'lodash'

import { bufferingDebounce } from '../stream'

var DEFAULT_DEBOUNCE = 200

export default function(op, ...pipelineNames) {
  return Bacon.mergeAll(pipelineNames.map(name => op.compiler.pipelines[name]))
}

