#!/bin/sh

browserify -o build/lz4.js -r ./lib/utils-js.js:./utils -r buffer -r ./lib/lz4.js:lz4 lib/lz4.js
minify build/lz4.js > build/lz4.min.js
