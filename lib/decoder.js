var Decoder = require('./decoder_stream')

/**
	Decode an LZ4 stream
 */
function LZ4_uncompress (input, options) {
	var output = []
	var decoder = new Decoder(options)

	decoder.on('data', function (chunk) {
		output.push(chunk)
	})

	decoder.end(input)

	return Buffer.concat(output)
}

exports.LZ4_uncompress = LZ4_uncompress