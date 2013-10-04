var lz4_static = require('./static')
var lz4_binding = lz4_static.bindings
var utils = require('./utils')
var Decoder = require('./decoder_stream')

function decodeError (offset, msg) {
	throw new Error( (msg || 'Invalid data') + ' at ' + offset )
}

/**
	Decode an LZ4 stream
 */
function LZ4_uncompress (input) {
	var output = []
	var decoder = new Decoder

	decoder.on('data', function (chunk) {
		output.push(chunk)
	})

	decoder.end(input)

	return Buffer.concat(output)
}

exports.LZ4_uncompress = LZ4_uncompress
