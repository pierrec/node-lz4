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
