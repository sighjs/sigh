import _ from 'lodash'
import { bufferingDebounce } from '../stream'

export default function(op, delay = 500) {
  // TODO: coalesce events to reflect latest fs state
  return bufferingDebounce(op.stream, delay).map(_.flatten)
}
