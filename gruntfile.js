module.exports = function(grunt) {
  grunt.initConfig({
    watch: {
      source: {
        files: 'src/**/*.js',
        tasks: ['build']
      },
    },
    clean: ['lib']
  })

  require('jit-grunt')(grunt)

  grunt.registerTask('build', function() {
    var done = this.async()

    grunt.util.spawn({
      cmd: 'traceur',
      args: '--modules commonjs --source-maps --dir src lib'.split(' ')
    },
    function(error, result, code) {
      // traceur doesn't use exit codes properly...
      if (result.stderr)
        grunt.log.error('\007' + result.stderr)
      done()
    })
  })
  grunt.registerTask('default', 'build')
}
