var Encoder = require('./encoder_stream')

/**
	Encode an LZ4 stream
 */
function LZ4_compress (input, options) {
	var output = []
	var encoder = new Encoder(options)

	encoder.on('data', function (chunk) {
		output.push(chunk)
	})

	encoder.end(input)

	return Buffer.concat(output)
}

exports.LZ4_compress = LZ4_compress
