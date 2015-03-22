var path = require('path')

module.exports = function(grunt) {
  grunt.initConfig({
    // TODO: remove mochaTest and watch, use `grunt sigh` instead
    mochaTest: {
      test: { src: 'lib/test/{,plugin/}*.spec.js' },
      options: {
        require: 'lib/test/bootstrap.js',
        reporter: 'spec',
        clearRequireCache: true
      },
    },
    watch: {
      sources: {
        files: 'src/**/*.js',
        tasks: ['build', 'test']
      },
      options: {
        spawn: false
      }
    },
    clean: ['lib/*']
  })

  require('jit-grunt')(grunt)

  function transpileEs6(sourceDir, destDir, done) {
    // TODO: do this with grunt-babel... need to work out how to use directory mode
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
  grunt.registerTask('default', ['build', 'test', 'watch'])

  grunt.registerTask('test', ['build', 'mochaTest'])

  grunt.registerTask('sigh', 'Use `sigh -w` to bootstrap then watch for changes', function() {
    this.async()
    require('./bootstrap')
  })
}
