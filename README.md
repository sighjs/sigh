# sigh

# Important note

Don't use this yet. We're not gonna pretend to be a working asset pipeline only for you to get disappointed when things don't work, there's enough JavaScript projects out there that look working and fully functional only to blow up in your face when you actually try to use them.

We're hoping gulp version 4 will fix things like watch support, depending on how long that takes to come out then hopefully we can abandon this project. If gulp 4 takes too long or doesn't work as well as we hope then this will definitely get more love.

If you are adventurous though, we are using this project successfuly on our own projects.

## Another asset pipeline

* Should support source maps at every stage of the pipeline like [plumber][plumber] and [gulp][gulp]
* Should be easy to write plugins in a small number of lines of code like [gobble][gobble]
* Should support watching files and updating the pipeline as files change like [plumber][plumber]

[plumber]: https://github.com/plumberjs/plumber
[gobble]: https://github.com/gobblejs/gobble
[gulp]: https://github.com/gulpjs/gulp

## Why write another one

* gulp is really cool but some simple operations such as merging two streams together whilst retaining source maps doesn't seem to be possible and it doesn't have a "watch your files" mode.
* Gobble is really cool and inspired a bunch of this, but I thought the design could be simplified by using arrays of resources as the pipeline payload rather than having exceptions in the code for various plugins.
* Broccoli is pretty cool but... no source maps. Writing plugins needs a lot of code also. Don't believe in the tree concept it uses.
* Plumber is so buggy we don't consider it functional and we spent many many hours trying to get it to work.

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

## Plugin options

Some plugins accept an object as their only/final parameter to allow customisation, e.g.:

```javascript
traceur({ getModulePath: function(path) { return path.replace(/[^/]+\//, '') })
```
This causes the traceur plugin to strip the first component from the file path to create the module path.

### traceur

* getModulePath - A function which turns the relative file path into the module path.
* modules - A string denoting the type of modules traceur should output e.g. amd/commonjs.

## TODO

* Source files content should be embedded in the source maps. Not having this is pretty annoying.
* sigh -w should watch Sigh.js file for changes in addition to the source files.
* Conditional pipeline operations e.g. "sigh -e dev" might avoid minification to reduce build times during development.
* Write sass, compass, less, coffeescript, eco, slim, jade and haml plugins.
