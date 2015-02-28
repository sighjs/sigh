# sigh

# Important note

Sigh is currently undergoing a rewrite to simplify the code further using [bacon.js streams](https://baconjs.github.io/).

## Another asset pipeline

* Should support source maps at every stage of the pipeline like [plumber][plumber] and [gulp][gulp]
* Should be easy to write plugins in a small number of lines of code like [gobble][gobble]
* Should support watching files and updating the pipeline as files change like [plumber][plumber]

[plumber]: https://github.com/plumberjs/plumber
[gobble]: https://github.com/gobblejs/gobble
[gulp]: https://github.com/gulpjs/gulp

## Why write another one

* gulp is really cool but some simple operations such as merging two streams together whilst retaining source maps doesn't seem to be possible and watching files for changes involves use of multiple extra modules.
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
module.exports = function(stream, options) {
  // TODO: adapt the stream here, see https://baconjs.github.io/
  return stream
}
```

The stream payload is a json object containing:
  * type: "add", "change", "rename"
  * path: path to source file.
  * map: source map content.
  * content: file content as string.

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
