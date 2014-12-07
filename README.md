# sigh

## Yet another asset pipeline

* Should support source maps at every stage of the pipeline like [plumber][plumber] and [gulp][gulp]
* Should be easy to write plugins in a small number of lines of code like [gobble][gobble]
* Should support watching files and updating the pipeline as files change like [plumber][plumber]

[plumber]: https://github.com/plumberjs/plumber
[gobble]: https://github.com/gobblejs/gobble
[gulp]: https://github.com/gulpjs/gulp

## Using sigh

Install sigh-cli globally:
```
sudo npm install -g sigh-cli
```

Install sigh in your project:
```
npm install sigh
```

Write a file called "Sigh.js" and put it in the root of your project:
```javascript
var all, glob, concat, write, traceur

module.exports = function(pipelines) {
  pipelines['js:all'] = [
    all(
      [ glob('src/*.js'), traceur() ],
      glob('vendor/*.js', 'bootstrap.js')
    ),
    concat('combined'),
    write('dist/assets')
  ]
}
```
This pipeline would glob files matching src/\*.js and transpile them with traceur, then concatenate that output together with the files matching vendor/\*.js followed by 'bootstrap.js' as the "all" and "glob" plugins preserve order. Finally the concatenated resource is written to the directory dist/assets after creating each missing directory component.

Running "sigh -w" would compile all the files then watch the directories and files matching the glob patterns for changes. Each plugin caches resources and only recompiles the files that have changed.

sigh plugins are injected into the variables defined at the top of the file. "all", "glob", "concat" and "write" are built-in (for now) whereas traceur is found by scanning package.json for dependency and devDependency entries of the format "sigh-\*".

### Run sigh
```shell
% sigh
```

## Writing sigh plugins

Writing a plugin for sigh is really easy. First make a node module for your plugin and in the main library file as indicated by package.json (defaulting to index.js) put something like this:

```javascript
module.exports = function() {
  return function(operation) {
    // operation.inputs is an array of resources passed from the previous operation in
    // the pipeline

    // this function should return an array of resources or a promise that resolves
    // to an array of resources
    return []
  }
}
```

### Plugins can cache many resources

```javascript
var Promise = require('bluebird')

module.exports = function() {
  return function(operation) {
    return Promise.all([
      operation.resource('directory/filename.js').loadFromFs(),
      operation.resource('directory2/filename2.js').loadFromFs(),
    ])
    .then(function() {
      // returns all resources created by this operation so far.
      // operation.removeResource() can be used to remove a resource.
      return operation.resources()
    })
  }
}
```

### Plugin operations can trigger the pipeline without receiving input
This plugin reloads a file whenever it changes then sends it down the pipeline.

```javascript
var gaze = require('gaze')

module.exports = function() {
  return function(operation) {
    gaze('file.js', function(err, watcher) {
      watcher.on('all', function(event, filePath) {
        operation.resource(filePath).loadFromFs().then(function() {
          // can pass an array of resources, otherwise operation.resources() is used.
          operation.next()
        })
      })
    })

    return []
  }
}
```
Calls to operation.next() are debounced before resources are sent down the pipeline.
