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
// var decoder = lz4.createDecoderStream({ incrementSize: (128 << 20), chunkSize: (128 << 20) })

var input = fs.createReadStream( inputFile )
var output = fs.createWriteStream( outputFile )

console.log('Uncompressing', inputFile, 'to', outputFile, '...')
decoder.on('end', function () {
	console.timeEnd('lz4')
})

console.time('lz4')
input.pipe(decoder).pipe(output)