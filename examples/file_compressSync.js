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

// Timing

console.log('Compressing %s to %s...', inputFile, outputFile)
var startTime = Date.now()
var compressed = lz4.encode(input)
var delta = Date.now() - startTime
var fileSize = fs.statSync(inputFile).size
console.log(
	'lz4 compressed %d bytes in %dms (%dMb/s)'
,	fileSize
,	delta
,	Math.round( 100 * fileSize / ( delta * (1 << 20) ) * 1000 ) / 100
)

// Save the uncompressed data
fs.writeFileSync( outputFile, compressed )