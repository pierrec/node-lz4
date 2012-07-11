var Stream = require('stream')
var inherits = require('inherits')

var encoder = require('./encoder')
var LZ4_compressChunk = encoder.LZ4_compressChunk
var LZ4_compressBound = encoder.LZ4_compressBound
var ARCHIVE_MAGICNUMBER = encoder.ARCHIVE_MAGICNUMBER
var DEFAULT_CHUNKSIZE = encoder.DEFAULT_CHUNKSIZE

/**
	Build up chunks and encode them one by one as they are assembled
 */
function Encoder (options) {
	if ( !(this instanceof Encoder) )
		return new Encoder(options)
	
	// Options
	options = options || {}
	this.chunkSize = options.chunkSize || (8 << 20) // 8Mb by default

	// Stream states
	this.readable = true
	this.writable = true
	this.ended = false
	this.paused = false
	this.needDrain = false

	// Data being processed
	this.buffer = new Buffer(0)

	this.first = true
	this.chunkBound = LZ4_compressBound(this.chunkSize) + 4
	this.ending = false
}

Encoder.prototype.write = function (data) {
	// Buffer the incoming data
	if (data)
		this.buffer = Buffer.concat(
			[ this.buffer, data ]
		, this.buffer.length + data.length
		)

	if (this.paused) {
		this.needDrain = true
		return false
	}

	if (this.first) {
		var buf = new Buffer(4)
		buf.writeUInt32LE(ARCHIVE_MAGICNUMBER, 0, false)
		this.emit( 'data', buf )
		this.first = false
	}

	var n = this.buffer.length
	var size = n >= this.chunkSize ? this.chunkSize : this.ending ? n : 0

	if (size > 0) {
		var buf = new Buffer(this.chunkBound)
		// var res = LZ4_compressChunk( this.buffer.slice(0, size), buf.slice(4) )
		var res = this.chunkBound - 4
		if (res === 0) {
			this.pause()
			this.emit( 'error', new Error('Compression error') )
			return false
		}
		buf.writeUInt32LE(res, 0, false)
		this.emit( 'data', buf.slice(0, res + 4) )

		this.buffer = this.buffer.slice(size)
	}
	
	if (this.needDrain) {
		this.needDrain = false
		this.emit('drain')
	}

	return true
}
Encoder.prototype.write_end = function () {
	this.emit( 'error', new Error('LZ4StreamEncoder#write: write after end') )
	return false
}

Encoder.prototype.end = function (data) {
	this.ending = true
	this.write(data)
	this.ending = false

	this.ended = true
	this.write = this.write_end

	this.emit('end')
}

Encoder.prototype.pause = function () {
	this.paused = true
}

Encoder.prototype.resume = function () {
	this.paused = false
	if (!this.ended) this.write()
}

Encoder.prototype.destroy = function () {
	this.readable = false
	this.writable = false
}

inherits(Encoder, Stream)

module.exports = Encoder
