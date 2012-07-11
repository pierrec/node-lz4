var Stream = require('stream')
var inherits = require('inherits')

var decoder = require('./decoder')
var LZ4_uncompressChunk = decoder.LZ4_uncompressChunk
var ARCHIVE_MAGICNUMBER = decoder.ARCHIVE_MAGICNUMBER
var DEFAULT_CHUNKSIZE = decoder.DEFAULT_CHUNKSIZE

/**
	Build up chunks and decode them one by one as they are assembled
 */
function Decoder (options) {
	if ( !(this instanceof Decoder) )
		return new Decoder(options)
	
	// Options
	options = options || {}
	this.chunkSize = options.chunkSize || DEFAULT_CHUNKSIZE

	// Stream states
	this.readable = true
	this.writable = true
	this.ended = false
	this.paused = false
	this.needDrain = false

	// Encoded data being processed
	this.buffer = new Buffer(0)

	this.state = 0 // 0: magic number, 1: chunk size, 2: sequences
	this.size = 0
}

Decoder.prototype.write = function (data) {
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

	var n = this.buffer.length
	var chunkSize = this.chunkSize

	if (n > 0)
		switch (this.state) {
			case 0:
				if (n < 4) break
				if ( this.buffer.readUInt32LE(0, true) !== ARCHIVE_MAGICNUMBER ) {
					this.pause()
					this.emit( 'error', 'LZ4StreamDecoder#write: Invalid magic number' )
					return false
				}
				this.state++
				if (n === 4) break
				n -= 4
				this.buffer = this.buffer.slice(4)
			case 1:
				if (n < 4) break
				this.state++
				if (n === 4) break

				// Encoded chunk size
				this.size = this.buffer.readUInt32LE(0, false)
			case 2:
				if (n < this.size) break

				var buf = new Buffer(chunkSize)
				var decodedSize = LZ4_uncompressChunk( this.buffer.slice(4, this.size + 4), buf )

				if (decodedSize < 0) {
					this.pause()
					this.emit( 'error', 'LZ4StreamDecoder#write: Invalid data at ' + (-decodedSize) )
					return false
				}

				this.emit( 'data', decodedSize < chunkSize ? buf.slice(0, decodedSize) : buf )
				this.buffer = this.buffer.slice(this.size + 4)

				this.state = 1
				this.write()
			break
			default:
				this.pause()
				this.emit( 'error', new Error('LZ4StreamDecoder#write: Invalid state: ' + this.state) )
			return false
		}
	
	if (this.needDrain) {
		this.needDrain = false
		this.emit('drain')
	}

	return true
}
Decoder.prototype.write_end = function () {
	this.emit( 'error', new Error('LZ4StreamDecoder#write: write after end') )
	return false
}

Decoder.prototype.end = function (data) {
	this.write(data)

	this.ended = true
	this.write = this.write_end

	this.emit('end')
}

Decoder.prototype.pause = function () {
	this.paused = true
}

Decoder.prototype.resume = function () {
	this.paused = false
	if (!this.ended) this.write()
}

Decoder.prototype.destroy = function () {
	this.readable = false
	this.writable = false
}

inherits(Decoder, Stream)

module.exports = Decoder
