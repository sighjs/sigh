var path = require('path')

// TODO: eat dogfood
module.exports = function(grunt) {
  grunt.initConfig({
    mochaTest: {
      test: { src: 'test/{,plugin/}*.spec.js' },
      options: {
        require: 'test/bootstrap.js',
        reporter: 'spec',
        clearRequireCache: true
      },
    },
    watch: {
      sources: {
        files: 'src/**/*.js',
        tasks: ['build', 'test']
      },
      testSources: {
        files: 'test/src/**/*.js',
        tasks: ['test']
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
  grunt.registerTask('buildTests', function() {
    transpileEs6('test/src', 'test', this.async())
  })
  grunt.registerTask('default', ['build', 'test', 'watch'])

  grunt.registerTask('test', ['buildTests', 'mochaTest'])

  grunt.registerTask('sigh', 'Use sigh -w to bootstrap self', function() {
    var invoke = require('./lib/api').invoke
    try {
      invoke({ watch: true })
      this.async()
    }
    catch (e) {
      console.warn(e.stack ? e.stack : e)
    }
  })
}
