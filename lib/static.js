/**
 * LZ4 based compression and decompression
 * Copyright (c) 2014 Pierre Curto
 * MIT Licensed
 */

// LZ4 stream constants
exports.MAGICNUMBER = 0x184D2204
exports.MAGICNUMBER_BUFFER = Buffer.alloc(4)
exports.MAGICNUMBER_BUFFER.writeUInt32LE(exports.MAGICNUMBER, 0)

exports.EOS = 0
exports.EOS_BUFFER = Buffer.alloc(4)
exports.EOS_BUFFER.writeUInt32LE(exports.EOS, 0)

exports.VERSION = 1

exports.MAGICNUMBER_SKIPPABLE = 0x184D2A50

// n/a, n/a, n/a, n/a, 64KB, 256KB, 1MB, 4MB
exports.blockMaxSizes = [ null, null, null, null, 64<<10, 256<<10, 1<<20, 4<<20 ]

// Compressed file extension
exports.extension = '.lz4'

// Internal stream states
exports.STATES = {
// Compressed stream
	MAGIC: 0
,	DESCRIPTOR: 1
,	SIZE: 2
,	DICTID: 3
,	DESCRIPTOR_CHECKSUM: 4
,	DATABLOCK_SIZE: 5
,	DATABLOCK_DATA: 6
,	DATABLOCK_CHECKSUM: 7
,	DATABLOCK_UNCOMPRESS: 8
,	DATABLOCK_COMPRESS: 9
,	CHECKSUM: 10
,	CHECKSUM_UPDATE: 11
,	EOS: 90
// Skippable chunk
,	SKIP_SIZE: 101
,	SKIP_DATA: 102
}

exports.SIZES = {
	MAGIC: 4
,	DESCRIPTOR: 2
,	SIZE: 8
,	DICTID: 4
,	DESCRIPTOR_CHECKSUM: 1
,	DATABLOCK_SIZE: 4
,	DATABLOCK_CHECKSUM: 4
,	CHECKSUM: 4
,	EOS: 4
,	SKIP_SIZE: 4
}

exports.utils = require('./utils')
