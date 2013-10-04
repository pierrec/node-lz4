/**
 * Uncompress an LZ4 stream
 */
// Modules
var path = require('path')
var fs = require('fs')
var lz4 = require('..')

// Input/Output files
var inputFile = process.argv[2] || 'test.lz4'
var outputFile = process.argv[3] || path.basename(inputFile, lz4.extension)

var decoder = lz4.createDecoderStream()

var input = fs.createReadStream( inputFile )
var output = fs.createWriteStream( outputFile )

// Timing
var startTime = Date.now()
decoder.on('end', function () {
	var fileSize = fs.statSync(outputFile).size
	var delta = Date.now() - startTime
	console.log(
		'lz4 decompressed %d bytes in %dms (%dMb/s)'
	,	fileSize
	,	delta
	,	Math.round( 100 * fileSize / ( delta * (1 << 20) ) * 1000 ) / 100
	)
})

console.log('Uncompressing %s to %s...', inputFile, outputFile)
input.pipe(decoder).pipe(output)