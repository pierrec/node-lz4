var lz4_static = require('./static')
var lz4_binding = require('../build/Release/lz4')

// Static buffers
var MAGICNUMBER_BUFFER = new Buffer(4)
MAGICNUMBER_BUFFER.writeUInt32LE(0x184D2204, 0, false)
var EOS_BUFFER = new Buffer(4)
EOS_BUFFER.writeUInt32LE(0, 0, false)

// n/a, n/a, n/a, n/a, 64KB, 256KB, 1MB, 4MB
var blockMaxSizes = [ null, null, null, null, 64<<10, 256<<10, 1<<20, 4<<20 ]

/**
	LZ4 Stream constructor
	options:
	blockIndependence {Boolean} default=true
	blockChecksum {Boolean} default=false
	blockMaxSize {Integer} default=4MB
	streamSize {Boolean} default=false
	streamChecksum {Boolean} default=true
	dict {Boolean} default=false
	dictId {Integer} default=0
	chunkSize {Integer} size of the chunk (default=8MB) (optional)
	hc {Boolean} enable high compression (default=false) (optional)
 */
var defaultOptions = {
	blockIndependence: true
,	blockChecksum: false
,	blockMaxSize: 4<<20
,	streamSize: false
,	streamChecksum: true
,	dict: false
,	dictId: 0
,	chunkSize: lz4_static.DEFAULT_CHUNKSIZE
,	hc: 0
}
function LZ4Stream (options) {
	// Set the options
	var o = options || defaultOptions
	if (o !== defaultOptions)
		Object.keys(defaultOptions).forEach(function (p) {
			if ( !o.hasOwnProperty(p) ) o[p] = defaultOptions[p]
		})

	this.options = o

	this.compress = o.hc ? lz4_binding.compress : lz4_binding.compressHC
	this.chunkBound = lz4_binding.compressBound(o.chunkSize)

	// Build the stream descriptor from the options
	// flags
	var descriptor_flg = 0
	descriptor_flg = descriptor_flg | (1 << 6) // Version 01
	descriptor_flg = descriptor_flg | ((o.blockIndependence & 1) << 5)
	descriptor_flg = descriptor_flg | ((o.blockChecksum & 1) << 4)
	descriptor_flg = descriptor_flg | ((o.streamSize & 1) << 3)
	descriptor_flg = descriptor_flg | ((o.streamChecksum & 1) << 2)
	descriptor_flg = descriptor_flg | (o.dict & 1)

	// block maximum size
	var descriptor_bd = blockMaxSizes.indexOf(o.blockMaxSize)
	if (descriptor_bd < 0)
		throw new Error('Invalid blockMaxSize: ' + o.blockMaxSize)

	this.descriptor = { flg: descriptor_flg, bd: descriptor_bd << 4 }

	this.blocks = []

	// Uncompressed full stream properties
	this.size = 0
	this.checksum = null
}

// Add data to the stream, splitting blocks according to chunkSize
LZ4Stream.prototype.push = function (data) {
	if (!data) return

	for (var i = 0, n = data.length; i < n; i += size) {
		var buf = new Buffer(this.chunkBound)
		var size = Math.min(n - i, this.options.chunkSize)

		this._push( data.slice(i, i + size) )
	}
}

// Compress and add a data block to the stream
// The block is uncompressed if it is bigger than blockMaxSize
LZ4Stream.prototype._push = function (data) {
	if (!data) return

	var compressed = new Buffer( lz4_binding.compressBound(data.length) )
	var compressedSize = this.compress(data, compressed)

	if (compressedSize < compressed.length)
		compressed = compressed.slice(0, compressedSize)

	// Set the block size
	var blockSize = new Buffer(4)
	if (compressedSize > this.options.blockMaxSize) {
		// Cannot compress the data, leave it as is
		blockSize.writeUInt32LE(0x8000, 0, false)
		compressed = data
	} else {
		blockSize.writeUInt32LE(compressedSize & 0xEFFF, 0, false)
	}

	this.blocks.push(blockSize, compressed)

	// Set the block checksum
	if (this.options.blockChecksum) {
		var checksum = new Buffer(4)
		var checksumValue = lz4_binding.xxHash(data, 0)
		checksum.writeUInt32LE(checksumValue, 0, false)
		res.push(checksum)
	}

	// Calculate the whole data checksum
	if (this.options.streamChecksum) {
		if (this.checksum === null) {
			this.checksum = lz4_binding.xxHash_init(0)
		}
		lz4_binding.xxHash_update(this.checksum, data)
	}

	this.size += data.length
}

LZ4Stream.prototype.flush = function () {
	var res = [ MAGICNUMBER_BUFFER ]
	// Allocate maximum descriptor size...
	var descriptor = new Buffer(15)
	var descriptorLength = 3

	// Update the stream descriptor
	descriptor.writeUInt8(this.descriptor.flg, 0, false)
	descriptor.writeUInt8(this.descriptor.bd, 1, false)

	if (this.options.streamSize) {
		var size = integerBytesLength(this.size)
		if (size > 8) throw new Error('Stream size overflow: ' + this.size)

		descriptor.writeUInt8(this.size, 2, false)
		descriptorLength += size
	}
	if (this.options.dict) {
		var size = integerBytesLength(this.options.dictId)
		if (size > 4) throw new Error('Dictionary size overflow: ' + this.options.dictId)
		descriptor.writeUInt8(this.dictId, descriptorLength - 1, false)
		descriptorLength += size
	}

	descriptor.writeUInt8(
	  descriptorChecksum( descriptor.slice(0, descriptorLength - 1) )
	, descriptorLength - 1, false
	)

	// ...then slice it accordingly
	if (descriptorLength < 15) descriptor = descriptor.slice(0, descriptorLength)

	res.push(descriptor)

	// Add compressed blocks
	res.push.apply(res, this.blocks)

	res.push(EOS_BUFFER)

	if (this.options.streamChecksum) {
		var checksum = new Buffer(4)
		var checksumValue = lz4_binding.xxHash_digest(this.checksum)
		checksum.writeUInt32LE(checksumValue, 0, false)
		res.push(checksum)
	}

	return Buffer.concat(res)
}

// Private functions
// Header checksum is second byte of xxhash using 0 as a seed
function descriptorChecksum (d) {
	return (lz4_binding.xxHash(d, 0) >> 8) & 0xFF
}

function integerBytesLength (i) {
	var n = 0
	while (i = i >> 8) n++
	return n
}

module.exports = LZ4Stream
