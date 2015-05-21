# Writing sigh plugins

sigh will generator your plugin scaffolding for you, all you need to do then is fill in a small amount of code, push to git and you're done.

First install sigh-cli:
```
sudo npm install -g sigh-cli
```

Then change to the directory where you want your plugin to live and type this:
```
sigh -p your-plugin-name
```

This will prompt you like this:
```
sigh plugin generator
? What is the name of this plugin? your plugin name
? Which github username/organisation should own this plugin? my-username
? What's your github author? Your Name <name@email.net>
? Which of the following apply to your plugin? (Press <space> to select)
❯◉ Maps input files to output files 1:1
? Which features would you like to use? (Press <space> to select)
❯◉ CircleCI integration
 ◯ TravisCI integration
? Which dependencies do you need? (Press <space> to select)
❯◉ bluebird
 ◉ lodash
 ◉ sigh-core
```
Your github username/author and CI choices are remembered and used as the defaults next time you run this command.

It will then generate you scaffold for a plugin in the current directory according to the answers you give.

To begin developing change to the directory containing your plugin and run sigh:

```
cd sigh-your-plugin-name
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
  return mapEvents(op.stream, function(event) {
    if (event.type !== 'add' && event.type !== 'change')
      return event

    // TODO: alter event here or return a new event
    return event
  })
}
```
This is EcmaScript 6, but don't worry `sigh -w` will recompile your files as they change and re-run your tests for you. When you push to the npm registry then the compiled resources are pushed so user's of your plugin don't need to worry.

The first argument (called `op` here) is used to pass information to the plugin, the subsequent arguments are passed from the arguments used within the `Sigh.js` file. The `operation` argument has the following fields:

 * `stream`: Bacon.js stream to adapt.
 * `treeIndex`: depth-first index of operator within pipeline tree. This can be written to in order to this to set the treeIndex for the next pipeline operation otherwise it is incremented by one.
 * `watch`: true if and only if the `-w` flag was used.
 * `environment`: environment being built (change with the `-e` or `--environment` flag).
 * `procPool`: A [ProcessPool](https://github.com/ohjames/process-pool) instance configured to limit the number of active processes accoring to the `-j` argument passed to sigh. This can be used to schedule work over multiple CPUs, see the [sigh-babel plugin](https://github.com/sighjs/sigh-babel/blob/master/src/index.js) for an example.
 * `compiler`: a pipeline compiler that can be used to compile any sub-trees, this is used in advanced plugins that take other pipelines as arguments.

The [sigh-core](https://github.com/sighjs/sigh-core) library also provides some functionality useful for writing plugins including access to the `Bacon` instance sigh uses.

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

## Incremental rebuilds and plugins

Due to the way Sigh's event stream works processing never needs to be repeated, only work relating to the actual files changed is performed. In most cases caching isn't necessary, in the few cases where it is Sigh handles it transparently. Library code available to plugin writers makes it simple to handle caching in cases where it is necessary.

# Future updates to this document
* Document file coalescing, for now see the [concat plugin](https://github.com/sighjs/sigh/blob/master/src/plugin/concat.js) and [toFileSystemState](https://github.com/sighjs/sigh-core/blob/master/src/stream.js).
