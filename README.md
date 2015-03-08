# sigh

`Sigh isn't quite ready, check back in a few weeks`

Sigh will be the best JavaScript asset pipeline! It combines the best features from all the best asset pipelines out there.

* Inputs are based on simple glob expressions and the pipeline uses a simple tree structure, no more 500 line grunt files or verbose gulp files.
* Uses Functional Reactive Programming via [bacon.js][bacon], your asset pipelines are bacon streams ([plumber][plumber] uses Microsoft's [rxjs][rxjs]).
* Support source maps at every stage of the pipeline: [plumber][plumber] and [gulp][gulp] (although gulp cannot concatenate source maps when merging streams).
* Caches all data in memory where possible rather than the filesystem: [gulp][gulp].
* Easy to write plugins in a small number of lines of code: [gobble][gobble].
* Support watching files and updating the pipeline as files change: [plumber][plumber] (and [gulp][gulp] when coupled with a couple of extra plugins).
* Most importantly, Sigh files have a really neat syntax: [plumber][plumber].
* Sigh can watch files for changes without a plugin, just use the `-w` flag. Due to the way Sigh's event stream works processing never needs to be repeated, only work relating to the actual files changed is performed. In most cases caching isn't necessary, in the few cases where it is Sigh handles it transparently. Library code available to plugin writers makes it simple to handle caching in cases where it is necessary.
* Sigh has automated tests (using mocha/chai) covering all functionality.

[plumber]: https://github.com/plumberjs/plumber
[gobble]: https://github.com/gobblejs/gobble
[gulp]: https://github.com/gulpjs/gulp
[rxjs]: https://github.com/Reactive-Extensions/RxJS
[bacon]: https://baconjs.github.io/

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
      [ glob('src/*.js'), babel() ],
      glob('vendor/*.js', 'bootstrap.js')
    ),
    concat('combined.js'),
    env(uglify(), 'production', 'staging'),
    write('dist/assets')
  ]

  pipelines['build:tests'] = [
    glob({ baseDir: 'src/test' }, '*.js'),
    babel(),
    write('test')
  ]

  pipelines['run:tests'] = [
    pipelineComplete(mochaTest(), 'build:source', 'build:tests')
  ]
}
```
This pipeline `build:source` globs files matching `src/*.js` and transpiles them with babel, this transpiled output is concatenated together with the files matching the glob pattern `vendor/*.js` followed by the file `bootstrap.js` (`concat` operators sort files by the depth-first index of the source stream that produced their untransformed content). The concatenated resource is uglified but only during builds for `production` and `staging` environments. The resulting file is written to the directory `dist/assets`.

The pipeline `build:tests` takes the files in `src/test`, compiles them with `babel` and writes each compiled file to the directory `test`. Each file's path relative to its `baseDir` becomes its offset within the output directory, in this case only the filename is used.

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

## Writing sigh plugins

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
The first argument is used to pass information to the plugin, the subsequent arguments are passed via the `Sigh.js` file. This argument has the following fields:

 * stream: Bacon.js stream to adapt.
 * treeIndex: depth-first index of operator in pipeline tree. This can be written to in order to this to set the treeIndex for the next pipeline operation otherwise it is incremented by one.
 * watch: true if and only if the `-w` flag was used.

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

# Built-in plugins

## glob

The glob plugin takes a list of glob expressions as arguments starting with an optional object containing options.

```javascript
module.exports = function(pipelines) {
  pipelines['js'] = [
    glob('test/*.js', 'src/*.js', 'bootstrap.js'),
    write('build')
  ]
}
```
  * debounce: file changes are batched until they have settled for more than `debounce` milliseconds, this defaults to 500ms.
```javascript
glob({ debounce: 200 }, 'lib/*.js')
```
  * basePath: restricts the glob to operate within basePath and also attaches the property to all resources (affecting their projectPath field).
```javascript
glob({ basePath: 'src' }, '*.js') // similar to glob('src/*.js')
```
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
This would transpile files matching `src/*.js` using babel and copy them to the directory build. Files matching `vendor/*.js` will all be concatenated together into a single file at `build/vendor.js`. The file `bootstrap.js` will be copied to `build` without modifications. A source map is created for each created files to point at the source(s).

## concat
The `concat` plugin concatenates all resources together into one file. The order in which the files are concatenated corresponds to the depth-first index within the tree of the plugin that produced the original source content of that file.

```javascript
pipelines['js'] = [
  all(
    [ glob('src/*.js'), babel() ],
    glob('loader.js', 'bootstrap.js')
  ),
  concat('output.js')
]
```
In this example the order of the files in `output.js` is determined by tree order:

1. The files in `src/*.js` compiled by babel.
2. The file `loader.js`.
3. The file `bootstrap.js`.

You can see here that `glob` uses multiple tree indexes and assigns them to events according to the index of the pattern that produced them.

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

# TODO
* Pass treeIndex back from `all` pipeline.
* `--environment/-e` flag.
* `pipelineComplete` plugin.
* mochaTest/uglify plugins (in external repositories).
* `sigh -w` should watch `Sigh.js` file for changes in addition to the source files.
* Write sass, compass, less, coffeescript, eco, slim, jade and haml plugins.
* Investigate possibility of writing an adapter so that grunt/gulp plugins can be used.
