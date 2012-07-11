/**
 * LZ4 based compression and decompression
 * Copyright (c) 2012 Pierre Curto
 * MIT Licensed
 */

var decoder = require('./decoder')

// Compressed file extension
exports.extension = '.lz4'
// Compressed file header (magic number)
exports.ARCHIVE_MAGICNUMBER = decoder.ARCHIVE_MAGICNUMBER

exports.createDecoderStream = require('./decoder_stream')
exports.decode = decoder.LZ4_uncompress

exports.createEncoderStream = require('./encoder_stream')
exports.encode = require('./encoder').LZ4_compress