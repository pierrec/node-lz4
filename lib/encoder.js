var lz4_static = require('./static')
var lz4_binding = require('../build/Release/lz4')
var utils = require('./utils')

/**
	LZ4 Stream constructor based on "LZ4 Streaming format" v1.4

	options:
	blockIndependence {Boolean} default=true
	blockChecksum {Boolean} default=false
	blockMaxSize {Integer} default=4MB
	streamSize {Boolean} default=false
	streamChecksum {Boolean} default=true
	dict {Boolean} default=false
	dictId {Integer} default=0
	highCompression {Boolean} enable high compression (default=false) (optional)
 */
var defaultOptions = {
	blockIndependence: true
,	blockChecksum: false
,	blockMaxSize: 4<<20
,	streamSize: false
,	streamChecksum: true
,	dict: false
,	dictId: 0
,	highCompression: false
}
function LZ4Stream (options) {
	// Set the options
	var o = options || defaultOptions
	if (o !== defaultOptions)
		Object.keys(defaultOptions).forEach(function (p) {
			if ( !o.hasOwnProperty(p) ) o[p] = defaultOptions[p]
		})

	this.options = o

	this.compress = o.highCompression ? lz4_binding.compressHC : lz4_binding.compress
	this.chunkBound = lz4_binding.compressBound(o.blockMaxSize)

	// Build the stream descriptor from the options
	// flags
	var descriptor_flg = 0
	descriptor_flg = descriptor_flg | (lz4_static.VERSION << 6)			// Version
	descriptor_flg = descriptor_flg | ((o.blockIndependence & 1) << 5)	// Block independence
	descriptor_flg = descriptor_flg | ((o.blockChecksum & 1) << 4)		// Block checksum
	descriptor_flg = descriptor_flg | ((o.streamSize & 1) << 3)			// Stream size
	descriptor_flg = descriptor_flg | ((o.streamChecksum & 1) << 2)		// Stream checksum
																		// Reserved bit
	descriptor_flg = descriptor_flg | (o.dict & 1)						// Preset dictionary

	// block maximum size
	var descriptor_bd = lz4_static.blockMaxSizes.indexOf(o.blockMaxSize)
	if (descriptor_bd < 0)
		throw new Error('Invalid blockMaxSize: ' + o.blockMaxSize)

	this.descriptor = { flg: descriptor_flg, bd: (descriptor_bd & 0x7) << 4 }
// console.log("flg", this.descriptor.flg.toString(2) )
// console.log("bd", this.descriptor.bd.toString(2) )

	this.blocks = []

	// Uncompressed stream properties
	this.size = 0
	this.checksum = null
}

// Add data to the stream, splitting blocks according to blockMaxSize
LZ4Stream.prototype.push = function (data) {
	if (!data) return

	for (var size, i = 0, n = data.length; i < n; i += size) {
		size = Math.min(n - i, this.options.blockMaxSize)
		this._push( data.slice(i, i + size) )
	}
}

// Compress and add a data block to the stream
// The block is uncompressed if it is bigger than blockMaxSize
LZ4Stream.prototype._push = function (data) {
	if (!data) return

	// Avoid LZ4 call if possible
	var compressed = new Buffer(
			data.length === this.options.blockMaxSize
			? this.chunkBound
			: lz4_binding.compressBound(data.length)
		)
	var compressedSize = this.compress(data, compressed)

	if (compressedSize < compressed.length)
		compressed = compressed.slice(0, compressedSize)

	// Set the block size
	var blockSize = new Buffer(4)
	if (compressedSize > this.options.blockMaxSize) {
		// Cannot compress the data, leave it as is
		// highest bit is 1 (uncompressed data)
		blockSize.writeUInt32LE( 0x80000000 | data.length, 0, false)
		compressed = data
	} else {
		// highest bit is 0 (compressed data)
		blockSize.writeUInt32LE(compressedSize, 0, false)
	}

	this.blocks.push(blockSize, compressed)

	// Set the block checksum
	if (this.options.blockChecksum) {
		var checksum = new Buffer(4)
		// xxHash checksum on undecoded data with a seed of 0
		checksum.writeUInt32LE( utils.blockChecksum(compressed), 0, false )
		this.blocks.push(checksum)
	}

	// Calculate the stream checksum
	if (this.options.streamChecksum) {
		this.checksum = utils.streamChecksum(data, this.checksum)
	}

	this.size += data.length
}

LZ4Stream.prototype.flush = function () {
	var res = [ lz4_static.MAGICNUMBER_BUFFER ]
	// Allocate maximum descriptor size...
	var descriptor = new Buffer(15)
	var descriptorLength = 3

	// Update the stream descriptor
	descriptor.writeUInt8(this.descriptor.flg, 0, false)
	descriptor.writeUInt8(this.descriptor.bd, 1, false)

	if (this.options.streamSize) {
		var size = integerBytesLength(this.size)
		if (size > 8) throw new Error('Stream size overflow: ' + this.size + ' bytes > 8')

		descriptor.writeUInt8(this.size, 2, false)
		descriptorLength += size
	}
	if (this.options.dict) {
		var size = integerBytesLength(this.options.dictId)
		if (size > 4) throw new Error('Dictionary size overflow: ' + this.options.dictId + ' bytes > 4')
		descriptor.writeUInt8(this.dictId, descriptorLength - 1, false)
		descriptorLength += size
	}

	descriptor.writeUInt8(
	  utils.descriptorChecksum( descriptor.slice(0, descriptorLength - 1) )
	, descriptorLength - 1, false
	)

	// ...then slice it accordingly
	if (descriptorLength < descriptor.length)
		descriptor = descriptor.slice(0, descriptorLength)

	res.push(descriptor)

	// Add compressed blocks
	res.push.apply(res, this.blocks)

	res.push(lz4_static.EOS_BUFFER)

	if (this.options.streamChecksum) {
		var checksum = new Buffer(4)
		checksum.writeUInt32LE( utils.streamChecksum(null, this.checksum), 0, false )
		res.push( checksum )
	}

	return Buffer.concat(res)
}

// Private functions
function integerBytesLength (i) {
	var n = 0
	while (i = i >> 8) n++
	return n
}

exports.LZ4_compress = function (input, options) {
	var LZ4S = new LZ4Stream(options)
	LZ4S.push(input)
	return LZ4S.flush()
}
