var Stream = require('stream')
var inherits = require('inherits')

var encoder = require('./encoder')
var LZ4_compressChunk = encoder.LZ4_compressChunk
var LZ4_compressHCChunk = encoder.LZ4_compressHCChunk
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
	this.chunkSize = options.chunkSize || DEFAULT_CHUNKSIZE
	this.compress = options.hc ? LZ4_compressHCChunk : LZ4_compressChunk

	// Stream states
	this.readable = true
	this.writable = true
	this.ended = false
	this.paused = false
	this.needDrain = false

	// Data being processed
	this.buffer = []
	this.length = 0

	this.first = true
	this.chunkBound = LZ4_compressBound(this.chunkSize) + 4
	this.ending = false
}

Encoder.prototype.write = function (data) {
	// Buffer the incoming data
	if (data && data.length > 0) {
		this.buffer.push(data)
		this.length += data.length
	}

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

	var n = this.length
	var size = n >= this.chunkSize ? this.chunkSize : this.ending ? n : 0

	if (size > 0) {
		var buf = new Buffer(this.chunkBound)
		var input = Buffer.concat(this.buffer, this.length)
		var res = this.compress( input.slice(0, size), buf.slice(4) )
		if (res === 0) {
			this.pause()
			this.emit( 'error', new Error('Compression error') )
			return false
		}
		buf.writeUInt32LE(res, 0, false)
		this.emit( 'data', buf.slice(0, res + 4) )

		this.length = input.length - size
		this.buffer =  this.length > 0 ? [ input.slice(size) ] : []
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
