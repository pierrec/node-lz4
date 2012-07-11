var lz4_binding = require('../build/Release/lz4')
var LZ4_compressChunk = lz4_binding.compress
//TODO maybe implement compressBound in JS as it is extremely simple
var LZ4_compressBound = lz4_binding.compressBound

var decoder = require('./decoder')
var ARCHIVE_MAGICNUMBER = decoder.ARCHIVE_MAGICNUMBER
var DEFAULT_CHUNKSIZE = decoder.DEFAULT_CHUNKSIZE

var ARCHIVE_MAGICNUMBER_BUFFER = new Buffer(4)

ARCHIVE_MAGICNUMBER_BUFFER.writeUInt32LE(ARCHIVE_MAGICNUMBER, 0, false)

/**
 * Encode a data set.
 *
 * @param input {Buffer} input data
 * @param chunkSize {Number} size of the chunk (default=8Mb) (optional)
 * @return {Buffer} encoded data
 * @public
 */
function LZ4_compress (input, chunkSize) {
	chunkSize = chunkSize || DEFAULT_CHUNKSIZE

	var chunkBound = LZ4_compressBound(chunkSize) + 4
	var output = [ ARCHIVE_MAGICNUMBER_BUFFER ]

	var i = 0
	var n = input.length
	while (i < n) {
		var buf = new Buffer(chunkBound)
		var size = chunkSize > n - i ? n - i : chunkSize
		var res = LZ4_compressChunk( input.slice(i, i + size), buf.slice(4) )
		if (res === 0) {
			throw new Error('Compression error')
		}
		buf.writeUInt32LE(res, 0, false)
		output.push( buf.slice(0, res + 4) )
		i += size
	}

	return Buffer.concat(output)
}

exports.LZ4_compress = LZ4_compress
exports.LZ4_compressChunk = LZ4_compressChunk
exports.LZ4_compressBound = LZ4_compressBound
exports.ARCHIVE_MAGICNUMBER = ARCHIVE_MAGICNUMBER
exports.DEFAULT_CHUNKSIZE = DEFAULT_CHUNKSIZE