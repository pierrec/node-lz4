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

// Timing
var startTime = Date.now()
console.log('Uncompressing %s to %s...', inputFile, outputFile)
var decoded = lz4.decode( input )
var delta = Date.now() - startTime

var fileSize = fs.statSync(inputFile).size
console.log(
	'lz4 decompressed %d bytes in %dms (%dMb/s)'
,	fileSize
,	delta
,	Math.round( 100 * fileSize / ( delta * (1 << 20) ) * 1000 ) / 100
)

// Save the uncompressed data
fs.writeFileSync( outputFile, decoded )