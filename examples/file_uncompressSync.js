/**
 * Uncompress a Buffer containing LZ4 compressed data
 */
// Modules
var path = require('path')
var fs = require('fs')
var lz4 = require('..')

// Input/Output files
var inputFile = process.argv[2] || 'test.lz4'
var outputFile = process.argv[3] || path.basename(inputFile, lz4.extension)

// Load the compressed data
var input = fs.readFileSync( inputFile )

// If the final uncompressed size is known, set the incrementSize with it
// for faster decoding (no time spent resizing the output buffer)
var incrementSize = (128 << 20) // 128Mb

console.log('Uncompressing', inputFile, 'to', outputFile, '...')
console.time('lz4')
var decoded = lz4.decode( input, incrementSize )
console.timeEnd('lz4')

// Save the uncompressed data
fs.writeFileSync( outputFile, decoded )