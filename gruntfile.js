var path = require('path')

module.exports = function(grunt) {
  function transpileEs6(sourceDir, destDir, done) {
    grunt.util.spawn({
      cmd: './node_modules/.bin/babel',
      args: ('--modules common --source-maps --out-dir ' + destDir + ' ' + sourceDir).split(' ')
    },
    function(error, result, code) {
      if (result.stderr)
        grunt.log.error('\x07' + result.stderr)
      else if (code)
        grunt.log.error('\x07unknown error compiling sigh')

      done(code ? Error('failed compilation') : null)
    })
  }

  grunt.registerTask('build', function() {
    transpileEs6('src', 'lib', this.async())
  })
}
