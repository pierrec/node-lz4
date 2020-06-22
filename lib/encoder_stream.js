var Transform = require('stream').Transform
var inherits = require('util').inherits

var lz4_static = require('./static')
var utils = lz4_static.utils
var lz4_binding = utils.bindings
var lz4_jsbinding = require('./binding')

var STATES = lz4_static.STATES
var SIZES = lz4_static.SIZES

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

function Encoder (options) {
	if ( !(this instanceof Encoder) )
		return new Encoder(options)
	
	Transform.call(this, options)

	// Set the options
	var o = options || defaultOptions
	if (o !== defaultOptions)
		Object.keys(defaultOptions).forEach(function (p) {
			if ( !o.hasOwnProperty(p) ) o[p] = defaultOptions[p]
		})

	this.options = o

	this.binding = this.options.useJS ? lz4_jsbinding : lz4_binding
	this.compress = o.highCompression ? this.binding.compressHC : this.binding.compress

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

	// Data being processed
	this.buffer = []
	this.length = 0

	this.first = true
	this.checksum = null
}
inherits(Encoder, Transform)

// Header = magic number + stream descriptor
Encoder.prototype.headerSize = function () {
	var streamSizeSize = this.options.streamSize ? SIZES.DESCRIPTOR : 0
	var dictSize = this.options.dict ? SIZES.DICTID : 0

	return SIZES.MAGIC + 1 + 1 + streamSizeSize + dictSize + 1
}

Encoder.prototype.header = function () {
	var headerSize = this.headerSize()
	var output = Buffer.alloc(headerSize)

	this.state = STATES.MAGIC
	output.writeInt32LE(lz4_static.MAGICNUMBER, 0)

	this.state = STATES.DESCRIPTOR
	var descriptor = output.slice(SIZES.MAGIC, output.length - 1)

	// Update the stream descriptor
	descriptor.writeUInt8(this.descriptor.flg, 0)
	descriptor.writeUInt8(this.descriptor.bd, 1)

	var pos = 2
	this.state = STATES.SIZE
	if (this.options.streamSize) {
		//TODO only 32bits size supported
		descriptor.writeInt32LE(0, pos)
		descriptor.writeInt32LE(this.size, pos + 4)
		pos += SIZES.SIZE
	}
	this.state = STATES.DICTID
	if (this.options.dict) {
		descriptor.writeInt32LE(this.dictId, pos)
		pos += SIZES.DICTID
	}

	this.state = STATES.DESCRIPTOR_CHECKSUM
	output.writeUInt8(
	  utils.descriptorChecksum( descriptor )
	, SIZES.MAGIC + pos
	)

	return output
}

Encoder.prototype.update_Checksum = function (data) {
	// Calculate the stream checksum
	this.state = STATES.CHECKSUM_UPDATE
	if (this.options.streamChecksum) {
		this.checksum = utils.streamChecksum(data, this.checksum)
	}
}

Encoder.prototype.compress_DataBlock = function (data) {
	this.state = STATES.DATABLOCK_COMPRESS
	var dbChecksumSize = this.options.blockChecksum ? SIZES.DATABLOCK_CHECKSUM : 0
	var maxBufSize = this.binding.compressBound(data.length)
	var buf = Buffer.alloc( SIZES.DATABLOCK_SIZE + maxBufSize + dbChecksumSize )
	var compressed = buf.slice(SIZES.DATABLOCK_SIZE, SIZES.DATABLOCK_SIZE + maxBufSize)
	var compressedSize = this.compress(data, compressed)

	// Set the block size
	this.state = STATES.DATABLOCK_SIZE
	// Block size shall never be larger than blockMaxSize
	// console.log("blockMaxSize", this.options.blockMaxSize, "compressedSize", compressedSize)
	if (compressedSize > 0 && compressedSize <= this.options.blockMaxSize) {
		// highest bit is 0 (compressed data)
		buf.writeUInt32LE(compressedSize, 0)
		buf = buf.slice(0, SIZES.DATABLOCK_SIZE + compressedSize + dbChecksumSize)
	} else {
		// Cannot compress the data, leave it as is
		// highest bit is 1 (uncompressed data)
		buf.writeInt32LE( 0x80000000 | data.length, 0)
		buf = buf.slice(0, SIZES.DATABLOCK_SIZE + data.length + dbChecksumSize)
		data.copy(buf, SIZES.DATABLOCK_SIZE);
	}

	// Set the block checksum
	this.state = STATES.DATABLOCK_CHECKSUM
	if (this.options.blockChecksum) {
		// xxHash checksum on undecoded data with a seed of 0
		var checksum = buf.slice(-dbChecksumSize)
		checksum.writeInt32LE( utils.blockChecksum(compressed), 0 )
	}

	// Update the stream checksum
	this.update_Checksum(data)

	this.size += data.length

	return buf
}

Encoder.prototype._transform = function (data, encoding, done) {
	if (data) {
		// Buffer the incoming data
		this.buffer.push(data)
		this.length += data.length
	}

	// Stream header
	if (this.first) {
		this.push( this.header() )
		this.first = false
	}

	var blockMaxSize = this.options.blockMaxSize
	// Not enough data for a block
	if ( this.length < blockMaxSize ) return done()

	// Build the data to be compressed
	var buf = Buffer.concat(this.buffer, this.length)

	for (var j = 0, i = buf.length; i >= blockMaxSize; i -= blockMaxSize, j += blockMaxSize) {
		// Compress the block
		this.push( this.compress_DataBlock( buf.slice(j, j + blockMaxSize) ) )
	}

	// Set the remaining data
	if (i > 0) {
		this.buffer = [ buf.slice(j) ]
		this.length = this.buffer[0].length
	} else {
		this.buffer = []
		this.length = 0
	}

	done()
}

Encoder.prototype._flush = function (done) {
	if (this.first) {
		this.push( this.header() )
		this.first = false
	}

	if (this.length > 0) {
		var buf = Buffer.concat(this.buffer, this.length)
		this.buffer = []
		this.length = 0
		var cc = this.compress_DataBlock(buf)
		this.push( cc )
	}

	if (this.options.streamChecksum) {
		this.state = STATES.CHECKSUM
		var eos = Buffer.alloc(SIZES.EOS + SIZES.CHECKSUM)
		eos.writeUInt32LE( utils.streamChecksum(null, this.checksum), SIZES.EOS )
	} else {
		var eos = Buffer.alloc(SIZES.EOS)
	}

	this.state = STATES.EOS
	eos.writeInt32LE(lz4_static.EOS, 0)
	this.push(eos)

	done()
}

module.exports = Encoder
