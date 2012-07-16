/**
	This is the LZ4 decoder implemented in JavaScript, which can therefore
	be used in the browser.
 */

;(function (Buffer, root) {

	var lz4 = {}

	if (module && module.exports) {
		module.exports = lz4
	} else {
		root.lz4 = lz4

		if (!Buffer) {
			Buffer = Uint8Array
			Buffer.prototype.concat = function (list, size) {
				if (arguments.length < 1)
					for (var i = 0, n = list.length; i < n; i++)
						size += list[i].length

				var res = new Buffer(size)
				var pos = 0

				for (i = 0; i < n; i++) {
					var item = list[i]
					for (var j = 0, m = item.length; j < m; j++)
						res[pos++] = item[j]
				}

				return res
			}
		}
	}

	/**
	 * Decode an encoded chunk. Assumptions: input contains all sequences of a 
	 * chunk, output is large enough to receive the decoded data.
	 * If the output buffer is too small, an error will be thrown.
	 * If the returned value is negative, an error occured at the returned offset.
	 *
	 * @param input {Buffer} input data
	 * @param output {Buffer} output data
	 * @return {Number} number of decoded bytes
	 * @private
	 */
	function LZ4_uncompressChunk (input, output) {
		// Process each sequence in the incoming data
		for (var i = 0, n = input.length, j = 0; i < n;) {
			var token = input[i++]

			// Literals
			// length of literals
			var literals_length = (token >> 4)
			for (
				var l = literals_length + 240
			; l === 255
			; literals_length += (l = input[i++])
			) {}

			// Copy the literals
			if (literals_length > 0) {
				var end = i + literals_length
				while (i < end) output[j++] = input[i++]
			}

			// End of buffer?
			if (i === n) return j

			// Match copy
			// 2 bytes offset (little endian)
			var offset = input[i++] | (input[i++] << 8)

			// 0 is an invalid offset value
			if (offset === 0) return -(i-2)

			// length of match copy
			var match_length = (token & 0xf)
			for (
				var l = match_length + 240
			; l === 255
			; match_length += (l = input[i++])
			) {}
			match_length += 4 // minmatch = 4

			// Copy the match
			var pos = j - offset // position of the match copy in the current output
			var end = j + match_length
			while (j < end) output[j++] = output[pos++]
		}

		return j
	}

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
		chunkSize = chunkSize || lz4.DEFAULT_CHUNKSIZE

		// Magic number check
		if (input.length < 4
		|| input.readUInt32LE(0, true) !== lz4.ARCHIVE_MAGICNUMBER )
			decodeError(0)

		// Output size is known, allocate all of it in one call
		if (outputSize) {
			var output = new Buffer(outputSize)

			// Current index in the output buffer
			var pos = 0

			for (var i = 4, n = input.length; i < n;) {
				var size = input.readUInt32LE(i, true)
				i += 4
				var decodedSize = LZ4_uncompressChunk( input.slice(i, i + size), output.slice(pos, pos + chunkSize) )
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

	lz4.LZ4_uncompressChunk = LZ4_uncompressChunk
	lz4.LZ4_uncompress = LZ4_uncompress
	lz4.ARCHIVE_MAGICNUMBER = 0x184C2102
	lz4.DEFAULT_CHUNKSIZE = 8 << 20

})( Buffer, this )
