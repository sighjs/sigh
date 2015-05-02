// sigh's node_modules/package.json are symlinked to the same directory as this
// sigh file which allows the babel plugin to be loaded.
var merge, concat, debounce, env, glob, write, babel

module.exports = function(pipelines) {
  pipelines['js'] = [
    merge(
      [ glob({ basePath: 'src' }, '*.js'), babel({ modules: 'common' }) ],
      glob('bootstrap.js')
    ),
    env([ debounce(500), concat('combined.js') ], 'production'),
    write('dist')
  ]
}
