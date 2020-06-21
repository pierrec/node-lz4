var Transform = require('stream').Transform
var inherits = require('util').inherits

var lz4_static = require('./static')
var utils = lz4_static.utils
var lz4_binding = utils.bindings
var lz4_jsbinding = require('./binding')

var STATES = lz4_static.STATES
var SIZES = lz4_static.SIZES

function Decoder (options) {
	if ( !(this instanceof Decoder) )
		return new Decoder(options)
	
	Transform.call(this, options)
	// Options
	this.options = options || {}

	this.binding = this.options.useJS ? lz4_jsbinding : lz4_binding

	// Encoded data being processed
	this.buffer = null
	// Current position within the data
	this.pos = 0
	this.descriptor = null

	// Current state of the parsing
	this.state = STATES.MAGIC

	this.notEnoughData = false
	this.descriptorStart = 0
	this.streamSize = null
	this.dictId = null
	this.currentStreamChecksum = null
	this.dataBlockSize = 0
	this.skippableSize = 0
}
inherits(Decoder, Transform)

Decoder.prototype._transform = function (data, encoding, done) {
	// Handle skippable data
	if (this.skippableSize > 0) {
		this.skippableSize -= data.length
		if (this.skippableSize > 0) {
			// More to skip
			done()
			return
		}

		data = data.slice(-this.skippableSize)
		this.skippableSize = 0
		this.state = STATES.MAGIC
	}
	// Buffer the incoming data
	this.buffer = this.buffer
					? Buffer.concat( [ this.buffer, data ], this.buffer.length + data.length )
					: data

	this._main(done)
}

Decoder.prototype.emit_Error = function (msg) {
	this.emit( 'error', new Error(msg + ' @' + this.pos) )
}

Decoder.prototype.check_Size = function (n) {
	var delta = this.buffer.length - this.pos
	if (delta <= 0 || delta < n) {
		if (this.notEnoughData) this.emit_Error( 'Unexpected end of LZ4 stream' )
		return true
	}

	this.pos += n
	return false
}

Decoder.prototype.read_MagicNumber = function () {
	var pos = this.pos
	if ( this.check_Size(SIZES.MAGIC) ) return true

	var magic = utils.readUInt32LE(this.buffer, pos)

	// Skippable chunk
	if ( (magic & 0xFFFFFFF0) === lz4_static.MAGICNUMBER_SKIPPABLE ) {
		this.state = STATES.SKIP_SIZE
		return
	}

	// LZ4 stream
	if ( magic !== lz4_static.MAGICNUMBER ) {
		this.pos = pos
		this.emit_Error( 'Invalid magic number: ' + magic.toString(16).toUpperCase() )
		return true
	}

	this.state = STATES.DESCRIPTOR
}

Decoder.prototype.read_SkippableSize = function () {
	var pos = this.pos
	if ( this.check_Size(SIZES.SKIP_SIZE) ) return true
	this.state = STATES.SKIP_DATA
	this.skippableSize = utils.readUInt32LE(this.buffer, pos)
}

Decoder.prototype.read_Descriptor = function () {
	// Flags
	var pos = this.pos
	if ( this.check_Size(SIZES.DESCRIPTOR) ) return true

	this.descriptorStart = pos

	// version
	var descriptor_flg = this.buffer[pos]
	var version = descriptor_flg >> 6
	if ( version !== lz4_static.VERSION ) {
		this.pos = pos
		this.emit_Error( 'Invalid version: ' + version + ' != ' + lz4_static.VERSION )
		return true
	}

	// flags
	// reserved bit should not be set
	if ( (descriptor_flg >> 1) & 0x1 ) {
		this.pos = pos
		this.emit_Error('Reserved bit set')
		return true
	}

	var blockMaxSizeIndex = (this.buffer[pos+1] >> 4) & 0x7
	var blockMaxSize = lz4_static.blockMaxSizes[ blockMaxSizeIndex ]
	if ( blockMaxSize === null ) {
		this.pos = pos
		this.emit_Error( 'Invalid block max size: ' + blockMaxSizeIndex )
		return true
	}

	this.descriptor = {
		blockIndependence: Boolean( (descriptor_flg >> 5) & 0x1 )
	,	blockChecksum: Boolean( (descriptor_flg >> 4) & 0x1 )
	,	blockMaxSize: blockMaxSize
	,	streamSize: Boolean( (descriptor_flg >> 3) & 0x1 )
	,	streamChecksum: Boolean( (descriptor_flg >> 2) & 0x1 )
	,	dict: Boolean( descriptor_flg & 0x1 )
	,	dictId: 0
	}

	this.state = STATES.SIZE
}

Decoder.prototype.read_Size = function () {
	if (this.descriptor.streamSize) {
		var pos = this.pos
		if ( this.check_Size(SIZES.SIZE) ) return true
		//TODO max size is unsigned 64 bits
		this.streamSize = this.buffer.slice(pos, pos + 8)
	}

	this.state = STATES.DICTID
}

Decoder.prototype.read_DictId = function () {
	if (this.descriptor.dictId) {
		var pos = this.pos
		if ( this.check_Size(SIZES.DICTID) ) return true
		this.dictId = utils.readUInt32LE(this.buffer, pos)
	}

	this.state = STATES.DESCRIPTOR_CHECKSUM
}

Decoder.prototype.read_DescriptorChecksum = function () {
	var pos = this.pos
	if ( this.check_Size(SIZES.DESCRIPTOR_CHECKSUM) ) return true

	var checksum = this.buffer[pos]
	var currentChecksum = utils.descriptorChecksum( this.buffer.slice(this.descriptorStart, pos) )
	if (currentChecksum !== checksum) {
		this.pos = pos
		this.emit_Error( 'Invalid stream descriptor checksum' )
		return true
	}

	this.state = STATES.DATABLOCK_SIZE
}

Decoder.prototype.read_DataBlockSize = function () {
	var pos = this.pos
	if ( this.check_Size(SIZES.DATABLOCK_SIZE) ) return true
	var datablock_size = utils.readUInt32LE(this.buffer, pos)
	// Uncompressed
	if ( datablock_size === lz4_static.EOS ) {
		this.state = STATES.EOS
		return
	}

// if (datablock_size > this.descriptor.blockMaxSize) {
// 	this.emit_Error( 'ASSERTION: invalid datablock_size: ' + datablock_size.toString(16).toUpperCase() + ' > ' + this.descriptor.blockMaxSize.toString(16).toUpperCase() )
// }
	this.dataBlockSize = datablock_size

	this.state = STATES.DATABLOCK_DATA
}

Decoder.prototype.read_DataBlockData = function () {
	var pos = this.pos
	var datablock_size = this.dataBlockSize
	if ( datablock_size & 0x80000000 ) {
		// Uncompressed size
		datablock_size = datablock_size & 0x7FFFFFFF
	}
	if ( this.check_Size(datablock_size) ) return true

	this.dataBlock = this.buffer.slice(pos, pos + datablock_size)

	this.state = STATES.DATABLOCK_CHECKSUM
}

Decoder.prototype.read_DataBlockChecksum = function () {
	var pos = this.pos
	if (this.descriptor.blockChecksum) {
		if ( this.check_Size(SIZES.DATABLOCK_CHECKSUM) ) return true
		var checksum = utils.readUInt32LE(this.buffer, this.pos-4)
		var currentChecksum = utils.blockChecksum( this.dataBlock )
		if (currentChecksum !== checksum) {
			this.pos = pos
			this.emit_Error( 'Invalid block checksum' )
			return true
		}
	}

	this.state = STATES.DATABLOCK_UNCOMPRESS
}

Decoder.prototype.uncompress_DataBlock = function () {
	var uncompressed
	// uncompressed?
	if ( this.dataBlockSize & 0x80000000 ) {
		uncompressed = this.dataBlock
	} else {
		uncompressed = Buffer.alloc(this.descriptor.blockMaxSize)
		var decodedSize = this.binding.uncompress( this.dataBlock, uncompressed )
		if (decodedSize < 0) {
			this.emit_Error( 'Invalid data block: ' + (-decodedSize) )
			return true
		}
		if ( decodedSize < this.descriptor.blockMaxSize )
			uncompressed = uncompressed.slice(0, decodedSize)
	}
	this.dataBlock = null
	this.push( uncompressed )

	// Stream checksum
	if (this.descriptor.streamChecksum) {
		this.currentStreamChecksum = utils.streamChecksum(uncompressed, this.currentStreamChecksum)
	}

	this.state = STATES.DATABLOCK_SIZE
}

Decoder.prototype.read_EOS = function () {
	if (this.descriptor.streamChecksum) {
		var pos = this.pos
		if ( this.check_Size(SIZES.EOS) ) return true
		var checksum = utils.readUInt32LE(this.buffer, pos)
		if ( checksum !== utils.streamChecksum(null, this.currentStreamChecksum) ) {
			this.pos = pos
			this.emit_Error( 'Invalid stream checksum: ' + checksum.toString(16).toUpperCase() )
			return true
		}
	}

	this.state = STATES.MAGIC
}

Decoder.prototype._flush = function (done) {
	// Error on missing data as no more will be coming
	this.notEnoughData = true
	this._main(done)
}

Decoder.prototype._main = function (done) {
	var pos = this.pos
	var notEnoughData

	while ( !notEnoughData && this.pos < this.buffer.length ) {
		if (this.state === STATES.MAGIC)
			notEnoughData = this.read_MagicNumber()

		if (this.state === STATES.SKIP_SIZE)
			notEnoughData = this.read_SkippableSize()

		if (this.state === STATES.DESCRIPTOR)
			notEnoughData = this.read_Descriptor()

		if (this.state === STATES.SIZE)
			notEnoughData = this.read_Size()

		if (this.state === STATES.DICTID)
			notEnoughData = this.read_DictId()

		if (this.state === STATES.DESCRIPTOR_CHECKSUM)
			notEnoughData = this.read_DescriptorChecksum()

		if (this.state === STATES.DATABLOCK_SIZE)
			notEnoughData = this.read_DataBlockSize()

		if (this.state === STATES.DATABLOCK_DATA)
			notEnoughData = this.read_DataBlockData()

		if (this.state === STATES.DATABLOCK_CHECKSUM)
			notEnoughData = this.read_DataBlockChecksum()

		if (this.state === STATES.DATABLOCK_UNCOMPRESS)
			notEnoughData = this.uncompress_DataBlock()

		if (this.state === STATES.EOS)
			notEnoughData = this.read_EOS()
	}

	if (this.pos > pos) {
		this.buffer = this.buffer.slice(this.pos)
		this.pos = 0
	}

	done()
}

module.exports = Decoder
