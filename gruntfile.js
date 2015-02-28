var path = require('path')

// TODO: eat dogfood
module.exports = function(grunt) {
  grunt.initConfig({
    mochaTest: {
      test: { src: 'test/*.js' },
      options: {
        reporter: 'spec',
        clearRequireCache: true
      },
    },
    watch: {
      sources: {
        files: 'src/**/*.js',
        tasks: ['build']
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

  function traceurBuild(sourceDir, destDir, done) {
    // see https://github.com/google/traceur-compiler/issues/1777 traceur source map
    // file/sources entries are relative to the cwd
    var prevCwd = process.cwd()
    process.chdir(destDir)
    sourceDir = path.relative(destDir, sourceDir)
    grunt.util.spawn({
      cmd: '../node_modules/.bin/traceur',
      args: ('--modules commonjs --source-maps --dir ' + sourceDir + ' .').split(' ')
    },
    function(error, result, code) {
      // traceur doesn't use exit codes properly...
      // it also logs errors on both stdout and stderr
      if (result.stderr)
        grunt.log.error('\x07' + result.stderr)
      if (result.stdout)
        grunt.log.error('\x07' + result.stdout)
      done()
    })
    process.chdir(prevCwd)
  }

  grunt.registerTask('build', function() {
    traceurBuild('src', 'lib', this.async())
  })
  grunt.registerTask('buildTests', function() {
    traceurBuild('test/src', 'test', this.async())
  })
  grunt.registerTask('default', 'build')

  grunt.registerTask('test', ['buildTests', 'mochaTest'])
}
