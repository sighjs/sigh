# sigh

Sigh is currently being rewritten but will be ready again soon with better code and testing of every feature.

Sigh will be the best JavaScript asset pipeline!

* Inputs are based on simple glob expressions and the pipeline uses a simple tree structure, no more 500 line grunt files or verbose gulp files.
* It uses Functional Reactive Programming via [bacon.js](https://baconjs.github.io/), your asset pipelines are bacon streams!
* Writing plugins is simple, especially when you can reuse the good bacon.js stuff!
* Sigh can watch files for changes using the -w flag, caching results is made easy.

## Another asset pipeline

* Should support source maps at every stage of the pipeline like [plumber][plumber] and [gulp][gulp]
* Should be easy to write plugins in a small number of lines of code like [gobble][gobble]
* Should support watching files and updating the pipeline as files change like [plumber][plumber]

[plumber]: https://github.com/plumberjs/plumber
[gobble]: https://github.com/gobblejs/gobble
[gulp]: https://github.com/gulpjs/gulp

## Why write another one

* gulp is really cool but some simple operations such as merging two streams together whilst retaining source maps doesn't seem to be possible, the syntax is also a little verbose, especially when watching files is needed.
* Gobble is really cool and inspired a bunch of this, but I thought the design could be simplified by using arrays of resources as the pipeline payload rather than having exceptions in the code for various plugins.
* Broccoli is pretty cool but... no source maps. Writing plugins needs a lot of code.
* Plumber uses a version of gaze that doesn't work on linux.

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
var all, glob, concat, write, babel, uglify

module.exports = function(pipelines) {
  pipelines['js:all'] = [
    all(
      [ glob('src/*.js'), babel() ],
      glob('vendor/*.js', 'bootstrap.js')
    ),
    concat('combined'),
    uglify(),
    write('dist/assets')
  ]
}
```
This pipeline would glob files matching src/\*.js and transpile them with babel, then concatenate that output together with the files matching vendor/\*.js followed by 'bootstrap.js' as the "all" and "glob" plugins preserve order. Finally the concatenated resource is uglified and written to the directory dist/assets.

Running "sigh -w" would compile all the files then watch the directories and files matching the glob patterns for changes. Each plugin caches resources and only recompiles the files that have changed.

sigh plugins are injected into the variables defined at the top of the file. "all", "glob", "concat", "write" and "babel" are built-in (for now) whereas uglify is found by scanning package.json for dependency and devDependency entries of the format "sigh-\*".

### Run sigh
```shell
% sigh
```

## Writing sigh plugins

Writing a plugin for sigh is really easy. First make a node module for your plugin and in the main library file as indicated by package.json (defaulting to index.js) put something like this:

```javascript
// this plugin adds a redundant variable statement at the end of each javascript file
module.exports = function(stream, text) {
  // do whatever you want with the stream here, see https://baconjs.github.io/
  return stream.map(function(events) {
    return events.map(function(event) {
      if (event.type !== 'remove' && event.fileType === 'js')
        event.data += '\nvar variable = "' + (text || "stuff") + '"'
      return event
    })
  })
}
```

Assuming the plugin above is called "suffixer" it could be used in a Sighfile like:
```javascript
module.exports = function(pipelines) {
  pipelines['js:all'] = [ glob('*.js'), suffixer('kittens'), write('build') ]
}
```

The stream payload is an array of event objects, each event object contains the following fields:
  * type: "add", "change", or "remove"
  * path: path to source file.
  * sourceMap: source map as javascript object (can be empty if no transformations have taken place).
  * data: file content as string.
  * fileType: filename extension.
  * baseDir: optional base directory containing resource.
  * projectPath: path with baseDir stripped off.

The first stream value will contain all source files, subsequent values will contain change events will be debounced and buffered.

## Plugin options

Some plugins accept an object as their only/first parameter to allow customisation, e.g.:

```javascript
babel({ getModulePath: function(path) { return path.replace(/[^/]+\//, '') })
```
This causes the babel plugin to strip the first component from the file path to create the module path.

### babel

* getModulePath - A function which turns the relative file path into the module path.
* modules - A string denoting the type of modules babel should output e.g. amd/common, see [the babel API](https://babeljs.io/docs/usage/options/).

### glob

The glob plugin takes a list of files as arguments but the first argument can be an object containing the following options:
  * debounce: file changes are batched until they have settled for more than "debounce" milliseconds, this defaults to 500ms.
  * baseDir: restricts the glob to operate within baseDir and also attaches the property to all resources (affecting their projectPath field).

```javascript
all(
  // Use the default debounce interval of 500ms
  glob('test/*.js'),
  // Like glob('src/*.js') but adds baseDir to resources
  glob({ baseDir: 'src' }, '*.js'),
  // Changes to files matching lib/*.js less than 200ms apart will be buffered together
  glob({ debounce: 200 }, 'lib/*.js')
)
```

## TODO

* Source files content should be embedded in the source maps. Not having this is pretty annoying.
* sigh -w should watch Sigh.js file for changes in addition to the source files.
* Conditional pipeline operations e.g. "sigh -e dev" might avoid minification to reduce build times during development.
* Write sass, compass, less, coffeescript, eco, slim, jade and haml plugins.
