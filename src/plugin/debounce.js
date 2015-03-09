import _ from 'lodash'
import { bufferingDebounce } from '../stream'

export default function(op, delay = 500) {
  return bufferingDebounce(op.stream, delay).map(_.flatten)
}
