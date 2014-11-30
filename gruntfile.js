// TODO: eat dogfood
module.exports = function(grunt) {
  grunt.initConfig({
    watch: {
      source: {
        files: 'src/**/*.js',
        tasks: ['build']
      },
      options: {
        spawn: false
      }
    },
    clean: ['lib/*']
  })

  require('jit-grunt')(grunt)

  grunt.registerTask('build', function() {
    var done = this.async()

    // because traceur places source-maps in the cwd
    process.chdir('lib')
    grunt.util.spawn({
      cmd: '../node_modules/.bin/traceur',
      args: '--modules commonjs --source-maps --dir ../src .'.split(' ')
    },
    function(error, result, code) {
      // traceur doesn't use exit codes properly...
      // it also logs errors on both stdout and stderr
      if (result.stderr)
        grunt.log.error('\007' + result.stderr)
      if (result.stdout)
        grunt.log.error('\007' + result.stdout)
      done()
    })
    process.chdir('..')
  })
  grunt.registerTask('default', 'build')
}
