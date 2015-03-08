var glob, babel, write, mochaTests

module.exports = function(pipelines) {
  pipelines['source:js'] = [
    glob('src/*.js'),
    babel({ modules: 'common' }),
    write('lib')
  ]

  pipelines['test:js'] = [
    glob('test/src/*.js'),
    babel({ modules: 'common' }),
    write('test')
  ]

  pipelines['tests:run'] = [
    pipelineComplete(mochaTests(), 'source:js', 'test:js')
  ]
}
