var lz4_binding = require('../build/Release/lz4')
var LZ4_compressChunk = lz4_binding.compress
var LZ4_compressHCChunk = lz4_binding.compressHC
//TODO maybe implement compressBound in JS as it is extremely simple
var LZ4_compressBound = lz4_binding.compressBound

var lz4_static = require('./static')

// Static Buffer holding the magic number
var ARCHIVE_MAGICNUMBER_BUFFER = new Buffer(4)
ARCHIVE_MAGICNUMBER_BUFFER.writeUInt32LE(lz4_static.ARCHIVE_MAGICNUMBER, 0, false)

/**
 * Encode a data set.
 *
 * @param input {Buffer} input data
 * @param chunkSize {Number} size of the chunk (default=8Mb) (optional)
 * @param high-compression {Boolean} enable high compression (default=false) (optional)
 * @return {Buffer} encoded data
 * @public
 */
function LZ4_compress (input, chunkSize, hc) {
	if (typeof chunkSize === 'boolean') {
		hc = chunkSize
		chunkSize = 0
	}
	chunkSize = chunkSize || lz4_static.DEFAULT_CHUNKSIZE

	var compress = hc ? LZ4_compressHCChunk : LZ4_compressChunk
	var chunkBound = LZ4_compressBound(chunkSize) + 4
	var output = [ ARCHIVE_MAGICNUMBER_BUFFER ]

	for (var i = 0, n = input.length; i < n; i += size) {
		var buf = new Buffer(chunkBound)
		var size = Math.min(n - i, chunkSize)
		var res = compress( input.slice(i, i + size), buf.slice(4) )
		if (res === 0) {
			throw new Error('Compression error')
		}
		buf.writeUInt32LE(res, 0, false)
		output.push( buf.slice(0, res + 4) )
	}

	return Buffer.concat(output)
}

exports.LZ4_compress = LZ4_compress
exports.LZ4_compressChunk = LZ4_compressChunk
exports.LZ4_compressHCChunk = LZ4_compressHCChunk
exports.LZ4_compressBound = LZ4_compressBound
