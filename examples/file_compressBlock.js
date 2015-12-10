/**
 * Compress data into a block (no archive format)
 */
// Modules
var path = require('path')
var fs = require('fs')
var lz4 = require('..')

// Input/Output files
var inputFile = process.argv[2] || 'test'
var outputFile = process.argv[3] || inputFile + lz4.extension

var input = fs.readFileSync( inputFile )
// Allocate max block size, __to be sliced__ accordingly after compression
var output = new Buffer( lz4.encodeBound(input.length) )

console.log('Compressing %s to %s...', inputFile, outputFile)
var startTime = Date.now()

// encodeBlock is synchronous
// native
var compressedBlockSize = lz4.encodeBlock(input, output)
// javascript
//var compressedBlockSize = require('../lib/binding').compress(input, output)

// Timing
var delta = Date.now() - startTime

if (compressedBlockSize > 0) {
	var fileSize = fs.statSync(inputFile).size
	console.log(
		'lz4 block compressed %d bytes into %d bytes in %dms (%dMb/s)'
	,	fileSize
	,	compressedBlockSize
	,	delta
	,	delta > 0 ? Math.round( 100 * fileSize / ( delta * (1 << 20) ) * 1000 ) / 100 : 0
	)
	output = output.slice(0, compressedBlockSize)
} else {
	console.log('data could not be compressed')
	output = input
}

fs.writeFileSync( outputFile, output )
