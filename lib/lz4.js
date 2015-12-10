/**
 * LZ4 based compression and decompression
 * Copyright (c) 2014 Pierre Curto
 * MIT Licensed
 */

module.exports = require('./static')

module.exports.version = "0.5.1"
module.exports.createDecoderStream = require('./decoder_stream')
module.exports.decode = require('./decoder').LZ4_uncompress

module.exports.createEncoderStream = require('./encoder_stream')
module.exports.encode = require('./encoder').LZ4_compress

// Expose block decoder and encoders
var bindings = module.exports.utils.bindings

module.exports.decodeBlock = bindings.uncompress

module.exports.encodeBound = bindings.compressBound
module.exports.encodeBlock = bindings.compress
module.exports.encodeBlockHC = bindings.compressHC
