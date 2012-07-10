/**
 * LZ4-JS - LZ4 based compression and decompression
 * Copyright (c) 2012 Pierre Curto
 * MIT Licensed
 */

var decoder = require('./decoder')

exports.createDecoderStream = require('./decoder_stream')
exports.decode = decoder.LZ4_uncompress

// Compressed file extension
exports.extension = '.lz4'
// Compressed file header (magic number)
exports.ARCHIVE_MAGICNUMBER = decoder.ARCHIVE_MAGICNUMBER