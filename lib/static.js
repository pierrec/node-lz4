/**
 * LZ4 based compression and decompression
 * Copyright (c) 2012 Pierre Curto
 * MIT Licensed
 */

// Compressed file header (magic number)
exports.ARCHIVE_MAGICNUMBER = 0x184C2102

// Default chunk size: 8MB
exports.DEFAULT_CHUNKSIZE = 8 << 20

// Compressed file extension
exports.extension = '.lz4'
