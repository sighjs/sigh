var glob, pipeline, babel, debounce, write, mocha

module.exports = function(pipelines) {
  pipelines['build-sources'] = [
    glob({ basePath: 'src' }, '*.js', 'plugin/*.js'),
    babel({ modules: 'common' }),
    write('lib')
  ]

  pipelines['build-tests'] = [
    glob({ basePath: 'src/test' }, '*.js', 'plugin/*.js'),
    babel({ modules: 'common' }),
    write('lib/test')
  ]

  pipelines.alias.build = ['build-sources', 'build-tests']

  pipelines['run-tests'] = [
    merge(
      { collectInitial: true },
      pipeline('build-sources'),
      pipeline('build-tests')
    ),
    pipeline({ activate: true }, 'mocha')
  ]

  pipelines.explicit.mocha = [ mocha({ files: 'lib/test/**/*.spec.js' }) ]
}
