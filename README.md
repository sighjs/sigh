# sigh

## Another asset pipeline

* Should support source maps at every stage of the pipeline like [plumber][plumber] and [gulp][gulp]
* Should be easy to write plugins in a small number of lines of code like [gobble][gobble]
* Should support watching files and updating the pipeline as files change like [plumber][plumber]

[plumber]: https://github.com/plumberjs/plumber
[gobble]: https://github.com/gobblejs/gobble
[gulp]: https://github.com/gulpjs/gulp

## Why write another one

gulp is really cool but some simple operations such as merging two streams together whilst retaining source maps is still not possible.
Plumber is really great and the author has been great at fixing bugs I found with it but ultimately I couldn't get the semi-advanced pipelines I wanted to use to work with it.
Gobble is really cool and inspired a bunch of this, but I thought the design could be simplified by using arrays of resources as the pipeline payload rather than having exceptions in the code for various plugins. Gobble has only recently added support for source maps whereas sigh has been built with them as a first class citizen.
Broccoli is pretty cool but the lack of source maps makes it unusable for my needs. It also seemed simpler to send an array of resources through the pipeline rather than using tree objects to represent directory hierarchies. Recursive glob patterns can be used to represent directory trees in sigh.

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
var all, glob, concat, write, traceur, uglify

module.exports = function(pipelines) {
  pipelines['js:all'] = [
    all(
      [ glob('src/*.js'), traceur() ],
      glob('vendor/*.js', 'bootstrap.js')
    ),
    concat('combined'),
    uglify(),
    write('dist/assets')
  ]
}
```
This pipeline would glob files matching src/\*.js and transpile them with traceur, then concatenate that output together with the files matching vendor/\*.js followed by 'bootstrap.js' as the "all" and "glob" plugins preserve order. Finally the concatenated resource is uglified then written to the directory dist/assets after creating each missing directory component.

Running "sigh -w" would compile all the files then watch the directories and files matching the glob patterns for changes. Each plugin caches resources and only recompiles the files that have changed.

sigh plugins are injected into the variables defined at the top of the file. "all", "glob", "concat", "write" and "traceur" are built-in (for now) whereas uglify is found by scanning package.json for dependency and devDependency entries of the format "sigh-\*".

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

### Why is the traceur plugin built in?

Sigh itself is written in EcmaScript 6 and given that the plugin is less than 30 lines of code it seems fair to include it for those who want to take advantage of the web now. Given the quality of source map support you don't even realise the browser doesn't natively support EcmaScript 6.

## Plugin options

Some plugins accept an object as their only/final parameter to allow customisation, e.g.:

```javascript
traceur({ getModulePath: function(path) { return path.replace(/[^/]+/, '') })
```
This causes the traceur plugin to strip the first component from the file path to create the module path.

### traceur

* getModulePath - A function which turns the relative file path into the module path.
* modules - A string denoting the type of modules traceur should output e.g. amd/commonjs.

## TODO

* Write sass, compass, less, coffeescript, eco, slim, jade and haml plugins.
