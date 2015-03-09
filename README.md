# sigh

[![build status](https://circleci.com/gh/sighjs/sigh.png?circle-token=beca7e0d044a1283d4633dc180c31f8e5592446c)](https://circleci.com/gh/sighjs/sigh)

Sigh combines the best features of the best asset pipelines.

* Pipelines are written in JavaScript with a very neat tree-based syntax, no more grunt spaghetti or verbose gulp files: [plumber][plumber].
* Uses Functional Reactive Programming via [bacon.js][bacon], your asset pipelines are bacon streams ([plumber][plumber] uses Microsoft's [rxjs][rxjs], [gulp][gulp] uses node's built-in stream API).
* Support source maps at every stage of the pipeline: [plumber][plumber] and [gulp][gulp] (gulp cannot concatenate source maps when merging streams).
* Caches all data in memory where possible rather than the filesystem: [gulp][gulp].
* Easy to write plugins in a small number of lines of code: [gobble][gobble].
* Support watching files and updating the pipeline as files change: [plumber][plumber] (and [gulp][gulp] when coupled with a couple of extra plugins). No special code or plugins are necessary for file watching, just use the `-w` flag.
* Support incremental rebuilds (only perform the minimum work necessary on file changes): [broccoli][broccoli].
* Inputs are based on simple glob expressions. Recursive glob expressions can be used when you want to speak in terms of directory trees rather than files.
* Supports `n:1` and `1:n` operations, Sigh is not built around `1:1` operations: [broccoli][broccoli].
* Operations wait for streams to settle when appropriate to avoid unnecessary work [plumber][plumber].
* Sigh has [automated tests](https://circleci.com/gh/sighjs/sigh) (using mocha/chai) that cover all functionality.

[plumber]: https://github.com/plumberjs/plumber
[gobble]: https://github.com/gobblejs/gobble
[gulp]: https://github.com/gulpjs/gulp
[rxjs]: https://github.com/Reactive-Extensions/RxJS
[bacon]: https://baconjs.github.io/
[broccoli]: https://github.com/broccolijs/broccoli

## Using sigh

Install sigh-cli globally:
```bash
% sudo npm install -g sigh-cli
```

Install sigh in your project:
```bash
% npm install sigh
```

Write a file called `Sigh.js` and put it in the root of your project:
```javascript
// To use a plugin it must be declared as a global variable.
var all, glob, concat, write, babel, env, pipelineComplete
// The above plugins are built-in, the next two are loaded from package.json.
var uglify, mochaTest

module.exports = function(pipelines) {
  pipelines['build:source'] = [
    all(
      [ glob('src/**/*.js'), babel() ],
      glob('vendor/*.js', 'bootstrap.js')
    ),
    concat('combined.js'),
    env(uglify(), 'production', 'staging'),
    write('build/assets')
  ]

  pipelines['build:tests'] = [
    glob({ basePath: 'test' }, '*.js'),
    babel(),
    write('build/test')
  ]

  pipelines['run:tests'] = [
    pipelineComplete(mochaTest(), 'build:source', 'build:tests')
  ]
}
```
The pipeline `build:source` globs files matching `src/**/*.js` (recursive glob) and transpiles them with babel, this transpiled output is concatenated together with the files matching the glob pattern `vendor/*.js` followed by the file `bootstrap.js` (`concat` operators sort files by the depth-first index of the source stream that produced their untransformed content). The concatenated resource is uglified but only during builds for `production` and `staging` environments. The resulting file is written to the directory `build/assets`.

The pipeline `build:tests` takes the files in `test`, compiles them with `babel` and writes each compiled file to the directory `build/test`. Each file's path relative to its `basePath` becomes its offset within the output directory, in this case only the filename is used.

The pipeline `run:tests` runs when either the `build:tests` or `build:source` pipelines complete and runs mocha with default options.

Running `sigh -w` would compile all the files then watch the directories and files matching the glob patterns for changes. Each plugin caches resources and only recompiles the files that have changed.

sigh plugins are injected into the variables defined at the top of the file. Some of the plugins are built-in (for now) and others are found by scanning package.json for dependency and devDependency entries of the format `sigh-*`.

### Running sigh

Compile all pipelines and exit:
```bash
% sigh
```

Compile all pipelines and then watch files for changes compiling those that have changed:
```bash
% sigh -w
```

Compile/watch only the specified pipeline (with the Sighfile.js shown above the source and tests would be compiled but the tests would never be run).
```
% sigh -w build:source build:tests
```

# Built-in plugins

## glob

The glob plugin takes a list of glob expressions as arguments starting with an optional object containing options.

```javascript
module.exports = function(pipelines) {
  pipelines['js'] = [
    glob('test/*.js', 'src/**/*.js', 'bootstrap.js'),
    write('build')
  ]
}
```
  * debounce: file changes are batched until they have settled for more than `debounce` milliseconds, this defaults to `200`.
```javascript
glob({ debounce: 100 }, 'lib/*.js')
```
  * basePath: restricts the glob to operate within basePath and also attaches the property to all resources (affecting their projectPath field).
```javascript
glob({ basePath: 'src' }, '*.js') // similar to glob('src/*.js')
```

## write
The `write` plugin is responsible for writing data to the filesystem. It adds files corresponding to `Event` objects with type `add`, updates files for events with type `change` and removes files corresponding to events with type `remove`. The contents of the output directory are recursively removed when the pipeline is constructed. The output path of each file is determined by prefixing its `projectPath` with the argument to `write`. Operations that produce events (such as glob) take a `basePath` option so that the output path can be easily manipulated.

```javascript
module.exports = function(pipelines) {
  pipelines['js'] = [
    glob({ basePath: 'src' }, '**/*.js'),
    write('build')
  ]
}
```
This pipeline takes all files with the extension `js` recursively reachable from `src` and writes each one to `build` directory (without the `src` prefix due to `basePath`).

## all
The `all` plugin combines many streams together.

```javascript
pipeline['js'] = [
  all(
    [ glob('src/*.js'), babel() ],
    [ glob('vendor/*.js'), concat('vendor.js') ],
    glob('bootstrap.js')
  ),
  write('build')
]
```
This would transpile files matching `src/*.js` using babel and copy them to the directory build. Files matching `vendor/*.js` will all be concatenated together into a single file at `build/vendor.js`. The file `bootstrap.js` will be copied to `build` without being modified beyond adding a source map comment.

## concat
The `concat` plugin concatenates all resources together into one file. The order in which the files are concatenated corresponds to the depth-first index within the tree of the plugin that produced the original source content of that file.

```javascript
pipelines['js'] = [
  all(
    [ glob('src/*.js'), babel() ],
    glob('loader.js', 'bootstrap.js')
  ),
  concat('output.js'),
  write('build')
]
```
In this example the order of the files in `output.js` is determined by tree order:

1. The files in `src/*.js` compiled by babel.
2. The file `loader.js`.
3. The file `bootstrap.js`.

You can see here that `glob` uses multiple tree indexes and assigns them to events according to the index of the pattern that produced them.

## env

Runs the operation only when one of the selected environments is chosen (using sigh's `-e` or `--environment` flag) otherwise pass data through unchanged.

```javascript
pipelines['js'] = [
  glob('src/*.js'),
  env(concat('output.js'), 'production', 'staging'),
  write('build')
]
```
This pipeline only concatenates the files together in `production` and `staging` builds otherwise multiple files are written to the build directory. The allowed environments may also be passed as an array.

## babel

Create a pipeline that transpiles the given source files using babel:
```javascript
module.exports = function(pipelines) {
  pipelines['js'] = [ glob('*.js'), babel(), write('build') ]
}
```

* getModulePath - A function which turns the relative file path into the module path.
```javascript
babel({ getModulePath: function(path) { return path.replace(/[^/]+\//, '') })
```
* modules - A string denoting the type of modules babel should output e.g. amd/common, see [the babel API](https://babeljs.io/docs/usage/options/).

# Writing sigh plugins

Writing a plugin for sigh is really easy. First make a node module for your plugin and in the main library file as indicated by package.json (which defaults to index.js) put something like this:

```javascript
// this plugin adds a redundant variable statement at the end of each javascript file
module.exports = function(operation, text) {
  // do whatever you want with the stream here, see https://baconjs.github.io/
  return operation.stream.map(function(events) {
    return events.map(function(event) {
      if (event.type !== 'remove' && event.fileType === 'js')
        event.data += '\nvar variable = "' + (text || "stuff") + '"'
      // you should make sure to call "event.applySourceMap" usually with
      // source maps generated by the current operation.
      return event
    })
  })
}
```
The first argument is used to pass information to the plugin, the subsequent arguments are passed from the arguments used within the `Sigh.js` file. The `operation` argument has the following fields:

 * `stream`: Bacon.js stream to adapt.
 * `treeIndex`: depth-first index of operator within pipeline tree. This can be written to in order to this to set the treeIndex for the next pipeline operation otherwise it is incremented by one.
 * `watch`: true if and only if the `-w` flag was used.
 * `environment`: environment being built (change with the `-e` or `--environment` flag).
 * `compiler`: a pipeline compiler that can be used to compile any sub-trees (this is only for advanced in operations that take other pipelines as arguments).

Assuming the plugin above is called `suffixer` it could be used in a Sighfile like:
```javascript
module.exports = function(pipelines) {
  pipelines['js'] = [ glob('*.js'), suffixer('kittens'), write('build') ]
}
```

The stream payload is an array of event objects, each event object contains the following fields:
  * `type`: `add`, `change`, or `remove`
  * `path`: path to source file.
  * `sourceMap`: source map as javascript object (read-only, see applySourceMap).
  * `data`: file content as string (plugins can modify this, if modified then applySourceMap should be called with a source map describing the modifications).
  * `sourceData`: original content before any transforms (read-only).
  * `fileType`: filename extension (read-only).
  * `basePath`: optional base directory containing resource.
  * `projectPath`: path with basePath stripped off.
  * `opTreeIndex`: depth-first index (within asset pipeline tree) of the source operator for this event.

The first array in the stream always contains an event of type `add` for every source file.

The following methods are available:
  * `applySourceMap(nextSourceMap)`: apply a new source map on top of the resource's existing source map.

## Incremental rebuilds and plugins

Due to the way Sigh's event stream works processing never needs to be repeated, only work relating to the actual files changed is performed. In most cases caching isn't necessary, in the few cases where it is Sigh handles it transparently. Library code available to plugin writers makes it simple to handle caching in cases where it is necessary.

# Future Work
* `pipelineComplete` plugin.
* Document plugin caching system, for now see the [concat plugin](https://github.com/sighjs/sigh/blob/master/src/plugin/concat.js) and [coalesceEvents](https://github.com/sighjs/sigh/blob/master/src/stream.js).
* mochaTest/uglify plugins (in external repositories).
* `sigh -w` should watch `Sigh.js` file for changes in addition to the source files.
* Write sass, compass, less, coffeescript, eco, slim, jade and haml plugins.
* Investigate possibility of writing an adapter so that grunt/gulp plugins can be used.
