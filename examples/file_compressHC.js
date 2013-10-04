/**
 * Compress a stream
 */
// Modules
var path = require('path')
var fs = require('fs')
var lz4 = require('..')

// Input/Output files
var inputFile = process.argv[2] || 'test'
var outputFile = process.argv[3] || inputFile + lz4.extension

var encoder = lz4.createEncoderStream({ highCompression: true })

var input = fs.createReadStream( inputFile )
var output = fs.createWriteStream( outputFile )

// Timing
encoder.on('end', function () {
	var delta = Date.now() - startTime
	var fileSize = fs.statSync(inputFile).size
	var outfileSize = fs.statSync(outputFile).size
	console.log(
		'lz4 compressed %d bytes into %d bytes in %dms (%dMb/s)'
	,	fileSize
	,	outfileSize
	,	delta
	,	Math.round( 100 * fileSize / ( delta * (1 << 20) ) * 1000 ) / 100
	)
})

console.log('Compressing %s to %s...', inputFile, outputFile)
var startTime = Date.now()
input.pipe(encoder).pipe(output)