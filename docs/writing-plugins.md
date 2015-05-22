# Writing sigh plugins

sigh will generator your plugin scaffolding for you, all you need to do then is fill in a small amount of code, push to git, `npm publish` and you're done.

First install sigh-cli:
```
sudo npm install -g sigh-cli
```

Then change to the directory where you want your plugin to live and type this:
```
sigh -p my-plugin-name
```

This will prompt you like this:
```
sigh plugin generator
? What is the name of this plugin? my plugin name
? Which github username/organisation should own this plugin? my-username
? What's your github author? Your Name <name@email.net>
? Which of the following apply to your plugin? (Press <space> to select)
❯◉ Maps input files to output files 1:1
 ◯ Spreads work over multiple CPUs
? Which features would you like to use? (Press <space> to select)
❯◉ CircleCI integration
 ◯ TravisCI integration
? Which dependencies do you need? (Press <space> to select)
❯◉ bluebird
 ◉ lodash
 ◉ sigh-core
```
This will generate code for you according to the responses you provide, your github username/author and CI choices are remembered and used as the defaults next time you run `sigh -p`.

To begin developing change to the directory containing your plugin and run sigh:

```
cd sigh-my-plugin-name
sigh -w
```

You can add the `-v` or `-vv` flags for more information. Everytime you change a source file the plugin will be recompiled and tested.

This is the code generated if you select the options shown above:
```javascript
import _ from 'lodash'
import Promise from 'bluebird'
import { Bacon } from 'sigh-core'
import { mapEvents } from 'sigh-core/lib/stream'

export default function(op, opts = {}) {
  return mapEvents(op.stream, event => {
    if (event.type !== 'add' && event.type !== 'change')
      return event

    // if (event.fileType !== 'relevantType') return event
    // TODO: alter event here or return a new event
    // event.changeFileSuffix('newSuffix')

    return event
  })
}
```
Plugins are written using EcmaScript 6 as `sigh -w` makes it trivial to translate the code to ES5, the generated tests also run with source maps remapped to show the stack trace in the original source code. When the plugin is pushed to the npm registry the generated code is pushed so that users of the module will not have to wait for any compilation when installing the plugin. If you would prefer to use ES5 then the source files can be removed after the first compilation and the generated ES5 files in `lib` can be edited from here.

The first argument (called `op` here) to the exported function is used to pass information to the plugin, the subsequent arguments are passed from the arguments used within the `Sigh.js` file. The `operation` argument has the following fields:

 * `stream`: Bacon.js stream to adapt.
 * `treeIndex`: depth-first index of operator within pipeline tree. This can be written to in order to this to set the treeIndex for the next pipeline operation otherwise it is incremented by one.
 * `watch`: true if and only if the `-w` flag was used.
 * `environment`: environment being built (change with the `-e` or `--environment` flag).
 * `procPool`: A [ProcessPool](https://github.com/ohjames/process-pool) instance configured to limit the number of active processes accoring to the `-j` argument passed to sigh. This can be used to schedule work over multiple CPUs, see the [sigh-babel plugin](https://github.com/sighjs/sigh-babel/blob/master/src/index.js) for an example.
 * `compiler`: a pipeline compiler that can be used to compile any sub-trees, this is used in advanced plugins that take other pipelines as arguments.

The [sigh-core](https://github.com/sighjs/sigh-core) library also provides some functionality useful for writing plugins including access to the `Bacon` instance sigh uses.

To adapt the code above so it suffixes a comment to each source file the scaffolded code would be adapted like this:

```javascript
import { mapEvents } from 'sigh-core/lib/stream'

export default function(op, suffix) {
  return mapEvents(op.stream, event => {
    if (event.type !== 'add' && event.type !== 'change' && event.fileType !== 'js')
      return event

    event.data += `\n// data added by sigh-suffix plugin: ${suffix || "default"}`
    return event
  })
}
```

Assuming the plugin above is called `suffixer` it could be used in a Sighfile like:
```javascript
module.exports = function(pipelines) {
  pipelines['js'] = [ glob('*.js'), suffixer('kittens'), write('build') ]
}
```

The stream payload is an array of event objects, each event object contains the following fields:
  * `type`: `add`, `change`, or `remove`
  * `path`: path to source file.
  * `sourceMap`: source map as javascript object, this is read-write but in most cases `applySourceMap` should be used instead of writing to this variable.
  * `data`: file content as string (plugins can modify this, if modified then applySourceMap should be called with a source map describing the modifications).
  * `sourceData`: original content before any transforms (read-only).
  * `fileType`: filename extension (read-only).
  * `basePath`: optional base directory containing resource.
  * `projectPath`: path with basePath stripped off.
  * `opTreeIndex`: depth-first index (within asset pipeline tree) of the source operator for this event.

The first array in the stream always contains an event of type `add` for every source file.

The following methods are available:
  * `applySourceMap(nextSourceMap)`: apply a new source map on top of the resource's existing source map.
  * `changeFileSuffix(targetSuffix)`: change the target suffix, e.g. from `scss` to `css`.

Plugins can also return a `Promise` to delay construction of the pipeline.

## Using multiple CPUs

By answering the generator questions in this way:

```
sigh plugin generator
? What is the name of this plugin? my plugin name
? Which github username/organisation should own this plugin? my-username
? What's your github author? Your Name <name@email.net>
? Which of the following apply to your plugin? (Press <space> to select)
❯◉ Maps input files to output files 1:1
 ◉ Spreads work over multiple CPUs
? Which features would you like to use? (Press <space> to select)
❯◉ CircleCI integration
 ◯ TravisCI integration
? Which dependencies do you need? (Press <space> to select)
❯◯ bluebird
```

The following scaffolding is generated:

```javascript
import _ from 'lodash'
import { Bacon } from 'sigh-core'
import { mapEvents } from 'sigh-core/lib/stream'

function myPluginNameTask(opts) {
  // this function is called once for each subprocess in order to cache state,
  // it is not a closure and does not have access to the surrounding state, use
  // `require` to include any modules you need, for further info see
  // https://github.com/ohjames/process-pool
  var log = require('sigh-core').log

  // this task runs inside the subprocess to transform each event
  return event => {
    var data, sourceMap
    // TODO: data = compile(event.data) etc.

    return { data, sourceMap }
  }
}

function adaptEvent(compiler) {
  // data sent to/received from the subprocess has to be serialised/deserialised
  return event => {
    if (event.type !== 'add' && event.type !== 'change')
      return event

    // if (event.fileType !== 'relevantType') return event

    return compiler(_.pick(event, 'type', 'data', 'path', 'projectPath')).then(result => {
      event.data = result.data

      if (result.sourceMap)
        event.applySourceMap(JSON.parse(result.sourceMap))

      // event.changeFileSuffix('newSuffix')
      return event
    })
  }
}

var pooledProc

export default function(op, opts = {}) {
  if (! pooledProc)
    pooledProc = op.procPool.prepare(pumpsTask, opts, { module })

  return mapEvents(op.stream, adaptEvent(pooledProc))
}
```

The comments labelled `TODO` must then be filled in to complete the plugin.

## Incremental rebuilds and plugins

Due to the way Sigh's event stream works processing never needs to be repeated, only work relating to the actual files changed is performed. In most cases caching isn't necessary, in the few cases where it is Sigh handles it transparently. Library code available to plugin writers makes it simple to handle caching in cases where it is necessary.

# Future updates to this document
* Document file coalescing, for now see the [concat plugin](https://github.com/sighjs/sigh/blob/master/src/plugin/concat.js) and [toFileSystemState](https://github.com/sighjs/sigh-core/blob/master/src/stream.js).
