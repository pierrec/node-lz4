var Transform = require('stream').Transform
var inherits = require('util').inherits

var decoder = require('./decoder')
var lz4_static = require('./static')
var lz4_binding = lz4_static.bindings
var utils = require('./utils')

function Decoder (options) {
	if ( !(this instanceof Decoder) )
		return new Decoder(options)
	
	Transform.call(this, options)
	// Options
	this.options = options || {}

	// Encoded data being processed
	this.buffer = new Buffer(0)
	// Current position within the data
	this.pos = 0
	this.descriptor = null

	// Current state of the parsing:
	// 0: magic number
	// compressed stream:
	// 1: stream descriptor flags
	// 2: block description
	// 3: dictionary id
	// 4: descriptor checksum
	// 5: data block size
	// 6: data block data
	// 7: data block checksum
	// 8: data block decompression
	// 90: end of stream
	// ...
	// skippable chunk:
	// 101: size
	// 102: skippable data
	this.state = 0

	this.descriptorStart = 0
	this.streamSize = null
	this.dictId = null
	this.currentStreamChecksum = null
	this.dataBlockSize = 0
}
inherits(Decoder, Transform)

Decoder.prototype._transform = function (data, encoding, done) {
	// Buffer the incoming data
	this.buffer = Buffer.concat(
			[ this.buffer, data ]
		,	this.buffer.length + data.length
		)

	this._flush(done)
}

Decoder.prototype.emit_Error = function (msg) {
	this.emit( 'error', new Error(msg + ' @' + this.pos) )
}

Decoder.prototype.check_Size = function (n) {
	var delta = this.buffer.length - this.pos
	if (delta <= 0 || delta < n) return true

	this.pos += n
	return false
}

Decoder.prototype.read_MagicNumber = function () {
	var pos = this.pos
	if ( this.check_Size(4) ) return

	var magic = this.buffer.readUInt32LE(pos, true)

	// Skippable chunk
	if ( (magic & 0xFFFFFFF0) === lz4_static.MAGICNUMBER_SKIPPABLE ) {
		this.state = 101
		return
	}

	// LZ4 stream
	if ( magic !== lz4_static.MAGICNUMBER ) {
		this.pos = pos
		this.emit_Error( 'Invalid magic number: ' + parseInt(magic, 16) )
		return
	}

	this.state++
}

Decoder.prototype.read_SkippableSize = function () {
	var pos = this.pos
	if ( this.check_Size(4) ) return
	this.state++
	var size = this.buffer.readUInt32LE(pos, true)
	this.pos += size
}

Decoder.prototype.read_SkippableData = function () {
	//TODO
	this.state = 5
}

Decoder.prototype.read_Descriptor = function () {
	// Flags
	var pos = this.pos
	if ( this.check_Size(2) ) return

	this.descriptorStart = pos

	// version
	var descriptor_flg = this.buffer.readUInt8(pos, true)
	var version = descriptor_flg >> 6
	if ( version !== lz4_static.VERSION ) {
		this.pos = pos
		this.emit_Error( 'Invalid version: ' + version + ' != ' + lz4_static.VERSION )
		return
	}

	// flags
	// reserved bit should not be set
	if ( (descriptor_flg >> 1) & 0x1 ) {
		this.pos = pos
		this.emit_Error('Reserved bit set')
		return
	}

	var blockMaxSizeIndex = (this.buffer.readUInt8(pos+1, true) >> 4) & 0x7
	var blockMaxSize = lz4_static.blockMaxSizes[ blockMaxSizeIndex ]
	if ( blockMaxSize === null ) {
		this.pos = pos
		this.emit_Error( 'Invalid block max size: ' + blockMaxSizeIndex )
		return
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

	this.state++
}

Decoder.prototype.read_Size = function () {
	if (this.descriptor.streamSize) {
		var pos = this.pos
		if ( this.check_Size(8) ) return
		//TODO max size is unsigned 64 bits
		this.streamSize = this.buffer.slice(pos, pos + 8)
	}

	this.state++
}

Decoder.prototype.read_DictId = function () {
	if (this.descriptor.dictId) {
		var pos = this.pos
		if ( this.check_Size(4) ) return
		this.dictId = this.buffer.readUInt32LE(pos, false)
	}

	this.state++
}

Decoder.prototype.read_DescriptorChecksum = function () {
	var pos = this.pos
	if ( this.check_Size(1) ) return

	var checksum = this.buffer.readUInt8(pos, true)
	var currentChecksum = utils.descriptorChecksum( this.buffer.slice(this.descriptorStart, pos) )
	if (currentChecksum !== checksum) {
		this.pos = pos
		this.emit_Error( 'Invalid stream descriptor checksum' )
		return
	}

	this.state++
}

Decoder.prototype.read_DataBlockSize = function () {
	var pos = this.pos
	if ( this.check_Size(4) ) return
	var datablock_size = this.buffer.readUInt32LE(pos, false)
	if ( datablock_size === lz4_static.EOS ) {
		this.state = 90
		return
	}

	this.dataBlockSize = datablock_size

	this.state++
}

Decoder.prototype.read_DataBlockData = function () {
	var pos = this.pos
	if ( this.check_Size(this.dataBlockSize) ) return

	this.dataBlock = this.buffer.slice(pos, pos + this.dataBlockSize)

	this.state++
}

Decoder.prototype.read_DataBlockChecksum = function () {
	if (this.descriptor.blockChecksum) {
		if ( this.check_Size(4) ) return
		var checksum = this.buffer.readUInt32LE(this.pos-4, false)
		var currentChecksum = utils.blockChecksum( this.dataBlock )
		if (currentChecksum !== checksum) {
			this.pos = pos
			this.emit_Error( 'Invalid block checksum' )
			return
		}
	}

	this.state++
}

Decoder.prototype.uncompress_DataBlock = function () {
	var uncompressed
	// uncompressed?
	if ( this.dataBlockSize >> 31 ) {
//console.log('uncompressed')
		uncompressed = this.dataBlock
	} else {
//console.log('compressed')
		uncompressed = new Buffer(this.descriptor.blockMaxSize)
		var decodedSize = lz4_binding.uncompress( this.dataBlock, uncompressed )
		if (decodedSize < 0) {
			this.emit_Error( 'Invalid data block: ' + (-decodedSize) )
			return
		}
		if ( decodedSize < this.descriptor.blockMaxSize )
			uncompressed = uncompressed.slice(0, decodedSize)
	}
	this.push( uncompressed )

	// Stream checksum
	if (this.descriptor.streamChecksum) {
		this.currentStreamChecksum = utils.streamChecksum(uncompressed, this.currentStreamChecksum)
	}

	this.state = 5
}

Decoder.prototype.read_EOS = function () {
	if (this.descriptor.streamChecksum) {
		var pos = this.pos
		if ( this.check_Size(4) ) return
		var checksum = this.buffer.readUInt32LE(pos, false)
		if ( checksum !== utils.streamChecksum(null, this.currentStreamChecksum) ) {
			this.pos = pos
			this.emit_Error( 'Invalid stream checksum: ' + parseInt(checksum, 16) )
			return
		}
	}

	this.state = 0
}

//TODO error reporting in _flush() vs _transform()
Decoder.prototype._flush = function (done) {
	var pos = this.pos

	while (this.pos < this.buffer.length) {
		if (this.state === 0)
			this.read_MagicNumber()

		if (this.state === 101)
			this.read_SkippableSize()

		if (this.state === 102)
			this.read_SkippableData()

		if (this.state === 1)
			this.read_Descriptor()

		if (this.state === 2)
			this.read_Size()

		if (this.state === 3)
			this.read_DictId()

		if (this.state === 4)
			this.read_DescriptorChecksum()

		if (this.state === 5)
			this.read_DataBlockSize()

		if (this.state === 6)
			this.read_DataBlockData()

		if (this.state === 7)
			this.read_DataBlockChecksum()

		if (this.state === 8)
			this.uncompress_DataBlock()

		if (this.state === 90)
			this.read_EOS()
	}

	if (this.pos > pos)
		this.buffer = this.buffer.slice(pos)

	done()
}

module.exports = Decoder
