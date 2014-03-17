/**
 * Uncompress data block (no archive format)
 */
// Modules
var path = require('path')
var fs = require('fs')
var lz4 = require('..')

// Input/Output files
var inputFile = process.argv[2] || 'test'
var outputFile = process.argv[3] || path.basename(inputFile, lz4.extension)

var input = fs.readFileSync( inputFile )
// Allocate output size... randomly :s
var output = new Buffer( input.length * 3 )

console.log('Uncompressing %s to %s...', inputFile, outputFile)
var startTime = Date.now()

// decodeBlock is synchronous
// native
// var uncompressedBlockSize = lz4.decodeBlock(input, output)
// javascript
var uncompressedBlockSize = require('../lib/binding').uncompress(input, output)

// Timing
var delta = Date.now() - startTime

if (uncompressedBlockSize > 0) {
	var fileSize = fs.statSync(inputFile).size
	console.log(
		'lz4 block uncompressed %d bytes into %d bytes in %dms (%dMb/s)'
	,	fileSize
	,	uncompressedBlockSize
	,	delta
	,	delta > 0 ? Math.round( 100 * fileSize / ( delta * (1 << 20) ) * 1000 ) / 100 : 0
	)
	fs.writeFileSync( outputFile, output.slice(0, uncompressedBlockSize) )
} else {
	console.log('data could not be uncompressed')
}
