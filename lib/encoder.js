var lz4_static = require('./static')
var lz4_binding = lz4_static.bindings
var utils = require('./utils')

var STATES = lz4_static.STATES
var SIZES = lz4_static.SIZES

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

	this.compress = o.highCompression ? lz4_binding.compressHCLimited : lz4_binding.compressLimited

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

	this.state = -1
}

// Add data to the stream, splitting blocks according to blockMaxSize
LZ4Stream.prototype.add = function (data) {
	if (!data) return

	for (var size, i = 0, n = data.length; i < n; i += size) {
		size = Math.min(n - i, this.options.blockMaxSize)
		this._add( data.slice(i, i + size) )
	}
}

// Shift a block
LZ4Stream.prototype.shiftBlock = function () {
	return this.blocks.shift()
}

// Compress and add a data block to the stream
// The block is uncompressed if it is bigger than blockMaxSize
LZ4Stream.prototype._add = function (data) {
	if (!data) return

	this.state = STATES.DATABLOCK_COMPRESS
	var compressed = new Buffer( data.length )
	var compressedSize = this.compress(data, compressed, data.length-1)

	// Set the block size
	var blockSize = new Buffer(4)
	if (compressedSize === 0) {
		// Cannot compress the data, leave it as is
		// highest bit is 1 (uncompressed data)
		blockSize.writeInt32LE( 0x80000000 | data.length, 0, false)
		compressed = data
	} else {
		// highest bit is 0 (compressed data)
		blockSize.writeUInt32LE(compressedSize, 0, false)
		compressed = compressed.slice(0, compressedSize)
	}

	this.blocks.push(blockSize, compressed)

	// Set the block checksum
	this.state = STATES.DATABLOCK_CHECKSUM
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

LZ4Stream.prototype.header = function () {
	this.state = STATES.MAGIC

	// Allocate magic number + descriptor size
	var magicSize = SIZES.MAGIC
	var streamSizeSize = this.options.streamSize ? SIZES.SIZE : 0
	var dictSize = this.options.dict ? SIZES.DICTID : 0
	var res = new Buffer(magicSize + 1 + 1 + streamSizeSize + dictSize + 1)

	res.writeUInt32LE(lz4_static.MAGICNUMBER, 0, false)

	this.state = STATES.DESCRIPTOR
	var descriptor = res.slice(magicSize, res.length - 1)

	// Update the stream descriptor
	descriptor.writeUInt8(this.descriptor.flg, 0, false)
	descriptor.writeUInt8(this.descriptor.bd, 1, false)

	var pos = 2
	this.state = STATES.SIZE
	if (this.options.streamSize) {
		descriptor.writeUInt32LE(0, pos, false)
		descriptor.writeUInt32LE(this.size, pos + 4, false)
		pos += streamSizeSize
	}
	this.state = STATES.DICTID
	if (this.options.dict) {
		descriptor.writeUInt32LE(this.dictId, pos, false)
		pos += dictSize
	}

	this.state = STATES.DESCRIPTOR_CHECKSUM
	res.writeUInt8(
	  utils.descriptorChecksum( descriptor )
	, magicSize + pos, false
	)

	return res
}

LZ4Stream.prototype.tail = function () {
	if (this.options.streamChecksum) {
		this.state = STATES.CHECKSUM
		var res = new Buffer(SIZES.EOS + SIZES.CHECKSUM)
		res.writeUInt32LE( utils.streamChecksum(null, this.checksum), SIZES.EOS, false )
	} else {
		var res = new Buffer(SIZES.EOS)
	}
	
	res.writeUInt32LE(lz4_static.EOS, 0, false)

	return res
}

LZ4Stream.prototype.done = function () {
	var res = []

	res.push( this.header() )

	// Add compressed blocks
	res.push.apply(res, this.blocks)

	res.push( this.tail() )

	return Buffer.concat(res)
}

exports.LZ4_compress = function (input, options) {
	var LZ4S = new LZ4Stream(options)
	LZ4S.add(input)
	return LZ4S.done()
}

exports.LZ4Stream = LZ4Stream
