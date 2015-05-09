# sigh

![logo](https://raw.githubusercontent.com/sighjs/sigh-website/master/images/logo.png)

[![build status](https://circleci.com/gh/sighjs/sigh.png)](https://circleci.com/gh/sighjs/sigh)

Sigh is a declarative functional reactive build system for node.js and the web.

Sigh combines the best features of the best asset pipelines with unique features including incredible speed by delegating tasks to multiple processes and perfect source maps even in production builds. With sigh sub-second incremental production rebuilds are a reality, including source map support allowing you to debug production issues happening against minified transpiled source against the original code.

* Pipelines are written in JavaScript with a very neat tree-based syntax, no more grunt spaghetti or verbose gulp files: [plumber][plumber].
* Supports gulp plugins.
* Uses Functional Reactive Programming via [bacon.js][bacon], your asset pipelines are bacon streams ([plumber][plumber] uses Microsoft's [rxjs][rxjs], [gulp][gulp] uses node's built-in stream API).
* Support source maps at every stage of the pipeline: [plumber][plumber] and [gulp][gulp] (gulp cannot concatenate source maps when merging streams).
* Schedules work over multiple CPU cores to reduce build times and make better use of available processing resources.
* Caches all data in memory where possible rather than the filesystem: [gulp][gulp].
* Easy to write plugins in a small number of lines of code: [gobble][gobble].
* Support watching files and updating the pipeline as files change: [plumber][plumber] (and [gulp][gulp] when coupled with a couple of extra plugins). No special code or plugins are necessary for file watching, just use the `-w` flag.
* Support incremental rebuilds (only perform the minimum work necessary on file changes): [broccoli][broccoli].
* Inputs are based on simple glob expressions. Recursive glob expressions can be used when you want to speak in terms of directory trees rather than files.
* Supports `n:n`, `n:1` and `1:n` operations: [broccoli][broccoli]. The stream payload is an array of events representing file `update`, `add` and `remove` events, `1:1` plugins emit and consume single element arrays.
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

Install sigh and sigh/gulp plugins in your project:
```bash
% npm install --save-dev sigh sigh-babel gulp-uglify
```

Write a file called `sigh.js` (or `Sigh.js`) and put it in the root of the project:
```javascript
// To use a plugin it must be declared as a global variable, some plugins are
// built-in and others are loaded by scanning package.json for entries
// beginning with "sigh-" or "gulp-".
var merge, glob, concat, write, env, pipeline
var uglify, mocha, babel

module.exports = function(pipelines) {
  pipelines['build:source'] = [
    merge(
      [ glob('src/**/*.js'), babel() ],
      glob('vendor/*.js', 'bootstrap.js')
    ),
    debounce(500),
    concat('combined.js'),
    env(uglify(), ['production', 'staging']),
    write('build/assets')
  ]

  pipelines['build:tests'] = [
    glob({ basePath: 'test' }, '*.js'),
    babel(),
    write('build/test')
  ]

  pipelines.alias.build = ['build:source', 'build:tests']

  pipelines['tests:run'] = [
    pipeline('build:source', 'build:tests'),
    debounce(500),
    mocha({ files: 'lib/**/*.spec.js' })
  ]
}
```
The pipeline `build:source` globs files matching `src/**/*.js` (recursive glob) and transpiles them with babel, this transpiled output is concatenated together with the files matching the glob pattern `vendor/*.js` followed by the file `bootstrap.js` (`concat` operators sort files by the depth-first index of the source stream that produced their untransformed content). The concatenated resource is uglified (using `gulp-uglify`) but only during builds for `production` and `staging` environments. The resulting file is written to the directory `build/assets`.

The pipeline `build:tests` takes the files in `test`, compiles them with `babel` and writes each compiled file to the directory `build/test`. Each file's path relative to its `basePath` becomes its offset within the output directory, in this case only the filename is used.

The pipeline `tests:run` runs mocha when either the `build:tests` or `build:source` pipelines complete. `tests:run` is delayed until neither pipeline completes for 500ms to avoid wasting CPU time.

Running `sigh -w` would compile all the files then watch the directories and files matching the glob patterns for changes. Each plugin caches resources and only recompiles the files that have changed.

sigh plugins are injected into the variables defined at the top of the file. Some of the plugins are built-in (for now) and others are found by scanning package.json for dependency and devDependency entries of the format `sigh-*`. Sigh also searches for plugins of the format `gulp-*` and adapts them to work with sigh.

### Running sigh

Running `sigh` with no arguments will run all pipelines.
```bash
% sigh
```

Compile all pipelines and then watch files for changes compiling those that have changed:
```bash
% sigh -w
```

Compile/watch only the specified pipeline (with the `sigh.js` shown above the source and tests would be compiled but the tests would never be run).
```bash
% sigh -w build:source build:tests
```

This is equivalent to using the alias defined in `sigh.js`:
```bash
% sigh -w build
```

It is also possible to create pipelines on the `pipeline.explicit` object that only run if specifically requested:

```javascript
  pipelines.explicit['tests:run'] = mocha({ files: 'lib/**/*.spec.js' })
```

This pipeline would only run if `sigh tests:run` is used but not with `sigh`.

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

### options
  * basePath: restricts the glob to operate within basePath and also attaches the property to all resources (affecting their projectPath field).

    ```javascript
    glob({ basePath: 'src' }, '*.js') // similar to glob('src/*.js')
    ```

  * debounce: Debounce file updates, defaults to 120 (milliseconds). Ideally it should not be set lower than 120, this interval is also used to iron out bad events reported by the underlying file watching plugin Sigh uses.

    ```javascript
    glob({ debounce: 500 }, '*.js')
    ```

## write
The `write` plugin is responsible for writing data to the filesystem. It adds files corresponding to `Event` objects with type `add`, updates files for events with type `change` and removes files corresponding to events with type `remove`. The output path of each file is determined by prefixing its `projectPath` with the argument to `write`. Operations that produce events (such as glob) take a `basePath` option so that the output path can be easily manipulated.

```javascript
module.exports = function(pipelines) {
  pipelines['js'] = [
    glob({ basePath: 'src' }, '**/*.js'),
    write('build')
  ]
}
```
This pipeline takes all files with the extension `js` recursively reachable from `src` and writes each one to `build` directory (without the `src` prefix due to `basePath`).

The write plugin forwards the events down the stream, this is useful in combination with the `pipeline` plugin.

The clobber option can be used to recursively remove the contents of the directory when the plugin is initialised:
```javascript
module.exports = function(pipelines) {
  pipelines['js'] = [
    glob({ basePath: 'src' }, '**/*.js'),
    write({ clobber: true }, 'build')
  ]
}
```

A glob pattern or list of glob patterns ([according to node-glob syntax](https://github.com/isaacs/node-glob)) can be supplied to `clobber` to restrict which files get removed.
```javascript
module.exports = function(pipelines) {
  pipelines['js'] = [
    glob({ basePath: 'src' }, '**/*.js'),
    write({ clobber: '!(jspm_packages|config.js)' }, 'build')
  ]
}
```

## merge
The `merge` plugin combines many streams together.

```javascript
pipelines['js'] = [
  merge(
    [ glob({ basePath: 'src' }, '*.js'), babel() ],
    [ glob('vendor/*.js'), concat('vendor.js') ],
    glob('bootstrap.js')
  ),
  write('build')
]
```
This would transpile files matching `src/*.js` using babel and copy them to the directory `build`. Files matching `vendor/*.js` will all be concatenated together into a single file at `build/vendor.js`. The file `bootstrap.js` will be copied to `build` without being modified beyond adding a source map comment.

## concat
The `concat` plugin concatenates all resources together into one file. The order in which the files are concatenated corresponds to the depth-first index within the tree of the plugin that produced the original source content of that file.

```javascript
pipelines['js'] = [
  merge(
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

## debounce
Combines events in the pipeline until the event stream settles for longer than the given period.

```javascript
pipelines['js'] = [
  glob('loader.js', 'bootstrap.js')
  debounce(200),
  concat('output.js'),
  write('build')
]
```
In this pipeline if `loader.js` and `bootstrap.js` change within 200 milliseconds of each other then the `concat` plugin will contain an array of two events (rather than being called twice with an array of one event each time). If no parameter is given then a default of 500 milliseconds is used.

## env

Runs the operation only when one of the selected environments is chosen (using sigh's `-e` or `--environment` flag) otherwise pass data through unchanged.

```javascript
pipelines['js'] = [
  glob('src/*.js'),
  env(concat('output.js'), ['production', 'staging']),
  write('build')
]
```
This pipeline only concatenates the files together in `production` and `staging` builds otherwise multiple files are written to the directory `build`. The allowed environments may also be passed as an array.

## pipeline

The pipeline plugin allows named pipelines to be connected.

```javascript
pipelines['source:js'] = [
  glob({ basePath: 'src' }, '*.js', 'plugin/*.js'), babel(), write('lib')
]

pipelines['test:js'] = [
  glob({ basePath: 'test' }, '*.js', 'plugin/*.js'), babel(), write('lib')
]

pipelines['tests:run'] = [
  pipeline('source:js', 'test:js'),
  debounce(700),
  mocha({ files: 'lib/test/*.spec.js' })
]
```

In this example the `pipeline` plugin in the `tests:run` pipeline forwards the output from the `source:js` and `test:js` pipelines down the stream. By default it will not force a pipeline to run unless the user specifies it e.g. if the user runs `sigh test:js tests:run` the `pipeline` plugin will issue stream events from the `test:js` pipeline only.

To force a pipeline operation to activate a named pipeline the `activate` option can be used, the previous `tests:run` pipeline could be rewritten more flexibly to allow the user to run mocha tests manually as such:

```javascript
pipelines['tests:run'] = [
  pipeline('source:js', 'test:js'),
  debounce(700),
  pipeline({ activate: true }, 'mocha')
]

pipelines.explicit.mocha = mocha({ files: 'lib/test/*.spec.js' })
```

This also shows that `pipeline` operations forward pipeline events to the named pipelines in addition to receiving events from them.

To activate some plugins and not others one of the following equivalent formats can be used:

```javascript
pipeline({ activate: true }, 'mocha', { activate: false }, 'express')
pipeline('express', { activate: true }, 'mocha')
merge(
  pipeline({ activate: true }, 'mocha'),
  pipeline('express')
)
```

# Writing sigh plugins

Please see [plugin writing guide](https://github.com/sighjs/sigh/blob/master/docs/writing-plugins.md)

# Future Work
* Should be able to forward stream input to a plugin that is nested inside another plugin (e.g. a merge).
* `sigh -w` should watch `sigh.js` file for changes in addition to the source files.
* `glob` plugin should also forward events from input stream.
* grunt plugin adapter.
