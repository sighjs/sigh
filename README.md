# sigh

## Yet another asset pipeline

* Should support source maps at every stage of the pipeline like [plumber](https://github.com/plumberjs/plumber).
* Should be simple like [gobble](https://github.com/gobblejs/gobble).
* Should be bug-free like [broccoli](https://github.com/broccolijs/broccoli).

## Using sigh

### Install sigh-cli globally:
```
sudo npm install -g sigh-cli
```

### Install sigh in your project:
```
npm install sigh
```

### Write a file called "Sigh.js" and put it in the root of your project:
```javascript
var all, glob, concat, write, traceur

module.exports = function(pipelines) {
  pipelines['js:all'] = [
    all(
      glob('src/*.js'),
      glob('vendor/*.js')
    ),
    traceur(),
    concat('combined'),
    write('dist/assets')
  ]
}
```
sigh plugins are injected into the variables defined at the top of the file. "all", "glob", "concat" and "write" are built-in (for now) whereas traceur is found by scanning package.json for dependency and devDependency entries of the format "sigh-\*".

### Run sigh
```shell
% sigh
```
