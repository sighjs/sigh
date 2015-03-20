var glob, pipeline, babel, debounce, write

module.exports = function(pipelines) {
  pipelines['source:js'] = [
    glob({ basePath: 'src' }, '**/*.js'),
    babel({ modules: 'common' }),
    write('lib')
  ]

  pipelines['test:js'] = [
    glob({ basePath: 'test/src' }, '**/*.js'),
    debounce(200),
    babel({ modules: 'common' }),
    write('test2') // TODO: use test
  ]

  pipelines['tests:run'] = [
    pipeline('source:js', 'test:js'),
    debounce()
    // TODO: run mocha
  ]
}
