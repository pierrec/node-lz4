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

var encoder = lz4.createEncoderStream({ hc: true })

var input = fs.createReadStream( inputFile )
var output = fs.createWriteStream( outputFile )

console.log('Compressing', inputFile, 'to', outputFile, '...')
encoder.on('end', function () {
	console.timeEnd('lz4')
})

console.time('lz4')
input.pipe(encoder).pipe(output)