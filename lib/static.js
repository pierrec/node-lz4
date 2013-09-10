/**
 * LZ4 based compression and decompression
 * Copyright (c) 2012 Pierre Curto
 * MIT Licensed
 */

// LZ4 stream constants
exports.MAGICNUMBER = 0x184D2204
exports.MAGICNUMBER_BUFFER = new Buffer(4)
exports.MAGICNUMBER_BUFFER.writeUInt32LE(exports.MAGICNUMBER, 0, false)

exports.EOS = 0
exports.EOS_BUFFER = new Buffer(4)
exports.EOS_BUFFER.writeUInt32LE(exports.EOS, 0, false)

exports.VERSION = 1

exports.MAGICNUMBER_SKIPPABLE = 0x184D2A50

// n/a, n/a, n/a, n/a, 64KB, 256KB, 1MB, 4MB
exports.blockMaxSizes = [ null, null, null, null, 64<<10, 256<<10, 1<<20, 4<<20 ]

// Compressed file extension
exports.extension = '.lz4'
