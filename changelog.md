# sigh changelog

## v0.12.25
 * merge with `collectInitial` didn't forward subsequent events in watch mode.

## v0.12.24
 * fix `merge` breakage from previous version.

## v0.12.23
 * `merge` has `collectInitial` option.

## v0.12.22
 * improvements to code.

## v0.12.21
 * `filter` plugin is now present as `select` and `reject`.

## v0.12.20
 * `select` and `reject` instead of `filter`.

## v0.12.20
 * write plugin sets `basePath` to equal write directory.
 * setters for Event.basePath and Event.projectPath.

## v0.12.19
 * fix crash when using gulp-adapter for file type that doesn't support identity source map generation.

## v0.12.18
 * fix writing files that do not support source maps.

## v0.12.17
 * fix crash when filter plugin filters all events.

## v0.12.16
 * add filter plugin.

## v0.12.15
 * glob: forwards input events down stream with glob/watch events.

## v0.12.14
 * debounce: avoid loss of events when a file is changed during debouncing of events in the init phase.

## v0.12.13
 * debounce: only debounce events during the init phase (when the initial state of the filesystem is being read).

## v0.12.12
 * concat/write: fix crash when writing/concatenating untransformed files.

## v0.12.11
 * fix deletion of last non-comment character when stripping source map comment from js/css file.
