/**
 * Compress a Buffer
 */
// Modules
var path = require('path')
var fs = require('fs')
var lz4 = require('..')

// Input/Output files
var inputFile = process.argv[2] || 'test'
var outputFile = process.argv[3] || inputFile + lz4.extension

// Load the data
var input = fs.readFileSync( inputFile )

console.log('Compressing', inputFile, 'to', outputFile, '...')
console.time('lz4')
var compressed = lz4.encode(input)
console.timeEnd('lz4')

// Save the uncompressed data
fs.writeFileSync( outputFile, compressed )