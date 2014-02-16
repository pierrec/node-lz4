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
			//TODO use Buffer.copy() for nodejs?
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
			//TODO use Buffer.copy() for nodejs?
			var pos = j - offset // position of the match copy in the current output
			var end = j + match_length
			while (j < end) output[j++] = output[pos++]
		}

		return j
	}

exports.uncompress = LZ4_uncompressChunk