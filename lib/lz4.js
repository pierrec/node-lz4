/**
 * LZ4 based compression and decompression
 * Copyright (c) 2012 Pierre Curto
 * MIT Licensed
 */

module.exports = require('./static')

module.exports.createDecoderStream = require('./decoder_stream')
module.exports.decode = require('./decoder').LZ4_uncompress

module.exports.createEncoderStream = require('./encoder_stream')
module.exports.encode = require('./encoder').LZ4_compress

// Expose chunk decoder and encoders
module.exports.decodeBlock = module.exports.createDecoderStream.prototype.uncompressBlock
module.exports.encodeBlockHC = module.exports.createEncoderStream.prototype.encodeBlockHC
module.exports.encodeBlock = module.exports.createEncoderStream.prototype.encodeBlock

// Identify browser environment for the browserified version of the decoder
if (typeof window != 'undefined' && window) {
	// Browserified
	window['LZ4'] = module.exports
	window['Buffer'] = Buffer
}