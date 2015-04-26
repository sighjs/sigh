var glob, pipeline, babel, debounce, write, mocha

module.exports = function(pipelines) {
  pipelines['source:js'] = [
    glob({ basePath: 'src' }, '*.js', 'plugin/*.js'),
    babel({ modules: 'common' }),
    write('lib')
  ]

  pipelines['test:js'] = [
    glob({ basePath: 'src/test' }, '*.js', 'plugin/*.js'),
    babel({ modules: 'common' }),
    write('lib/test')
  ]

  pipelines.alias.build = ['test:js', 'source:js']

  pipelines['tests:run'] = [
    pipeline('source:js', 'test:js'),
    debounce(700),
    // TODO: pipeline('mocha')
    mocha({ files: 'lib/test/**/*.spec.js' })
  ]

  pipelines.explicit.mocha = [ mocha({ files: 'lib/test/**/*.spec.js' }) ]
}
