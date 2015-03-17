var merge, babel, concat, debounce, env, glob, write

module.exports = function(pipelines) {
  pipelines['js:all'] = [
    merge(
      [ glob({ basePath: 'src' }, '*.js'), babel({ modules: 'common' }) ],
      glob('bootstrap.js')
    ),
    env([ debounce(500), concat('combined.js') ], 'production'),
    write('dist')
  ]
}
