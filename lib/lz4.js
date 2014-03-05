/**
 * LZ4 based compression and decompression
 * Copyright (c) 2014 Pierre Curto
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
