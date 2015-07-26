# sigh changelog

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
