#!/bin/sh

browserify  -r ./lib/utils-js.js:./utils -r buffer -r xxhashjs -r ./lib/lz4l.js:lz4 -o build/lz4.js lib/lz4l.js && \
minify build/lz4.js > build/lz4.min.js

