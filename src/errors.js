export class UserError {
  constructor(msg) { this.message = msg }
}

export function rootErrorHandler(err) {
  // TODO: make
  if (err instanceof UserError)
    console.log('\x07' + err)
  else
    console.log('\x07Unexpected error:', err.stack ? err.stack : err)
}
