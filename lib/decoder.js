var lz4_binding = require('../build/Release/lz4')
var lz4_static = require('./static')

var LZ4_uncompressAll = lz4_binding.uncompress
var LZ4_uncompressChunk = lz4_binding.uncompress_unknownOutputSize

/**
	Sequence definition: name (bytes length)
	token (1)
	literals length (0-n)
	literals (0-l)
	offset (2)
	match copy length (0-c)

	Chunk definition:
	size (4) = n [unsigned 32 bits little endian integer]
	sequences (n)

	lz4demo32 and lz4demo64 output:
	magic number (4) [unsigned 32 bits little endian integer]
	chunks (n)
 */

function decodeError (offset) {
	throw new Error('Invalid data at ' + offset)
}

/**
 * Decode an encoded data set.
 * If the output size is known beforehand, set it to increase performance.
 *
 * @param input {Buffer} input data
 * @param chunkSize {Number} size of the chunk (default=8Mb) (optional)
 * @param outputSize {Number} size of the output (optional)
 * @return {Buffer} decoded data
 * @public
 */
function LZ4_uncompress (input, chunkSize, outputSize) {
	chunkSize = chunkSize || lz4_static.DEFAULT_CHUNKSIZE

	// Magic number check
	if (input.length < 4
	|| input.readUInt32LE(0, true) !== lz4_static.ARCHIVE_MAGICNUMBER )
		decodeError(0)

	// Output size is known, allocate all of it in one call
	if (outputSize) {
		var output = new Buffer(outputSize)

		// Current index in the output buffer
		var pos = 0

		for (var i = 4, n = input.length; i < n;) {
			var size = input.readUInt32LE(i, true)
			i += 4
			var decodedSize = LZ4_uncompressAll( input.slice(i, i + size), output.slice(pos, pos + chunkSize) )
			if (decodedSize < 0) decodeError(-decodedSize)
			i += size
			pos += decodedSize
		}

		return output
	}

	// Unknown output size, allocate on each pass
	var output = []
	for (var i = 4, n = input.length; i < n;) {
		var size = input.readUInt32LE(i, true)
		i += 4
		var buf = new Buffer(chunkSize)
		var decodedSize = LZ4_uncompressChunk( input.slice(i, i + size), buf )
		if (decodedSize < 0) decodeError(-decodedSize)
		output.push( decodedSize < chunkSize ? buf.slice(0, decodedSize) : buf )
		i += size
	}

	return Buffer.concat(output)
}

exports.LZ4_uncompressChunk = LZ4_uncompressChunk
exports.LZ4_uncompress = LZ4_uncompress
