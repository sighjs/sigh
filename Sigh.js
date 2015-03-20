var glob, pipeline, babel, debounce, write

module.exports = function(pipelines) {
  pipelines['source:js'] = [
    glob({ basePath: 'src' }, '*.js', 'plugin/*.js'),
    babel({ modules: 'common' }),
    write('lib')
  ]

  pipelines['test:js'] = [
    glob({ basePath: 'src/test' }, '*.js', 'plugin/*.js'),
    debounce(200),
    babel({ modules: 'common' }),
    write('lib/test')
  ]

  pipelines['tests:run'] = [
    pipeline('source:js', 'test:js'),
    debounce(700)
    // TODO: run mocha
  ]
}
