# sigh

## Yet another asset pipeline

* Should support source maps at every stage of the pipeline like [plumber][plumber] and [gulp][gulp]
* Should be easy to write plugins in a small number of lines of code like [gobble][gobble]
* Should support watching files and updating the pipeline as files change like [plumber][plumber]

[plumber]: https://github.com/plumberjs/plumber
[gobble]: https://github.com/gobblejs/gobble
[gulp]: https://github.com/gulpjs/gulp

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
