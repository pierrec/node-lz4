var Transform = require('stream').Transform
var inherits = require('util').inherits

var decoder = require('./decoder')
var LZ4_uncompressChunk = decoder.LZ4_uncompressChunk
var ARCHIVE_MAGICNUMBER = decoder.ARCHIVE_MAGICNUMBER
var DEFAULT_CHUNKSIZE = decoder.DEFAULT_CHUNKSIZE


function Decoder (options) {
	if ( !(this instanceof Decoder) )
		return new Decoder(options)
	
	Transform.call(this, options)
	// Options
	options = options || {}
	this.chunkSize = options.chunkSize || DEFAULT_CHUNKSIZE

	// Encoded data being processed
	this.buffer = new Buffer(0)

	this.state = 0 // 0: magic number, 1: chunk size, 2: sequences
	this.size = 0
}
inherits(Decoder, Transform)

Decoder.prototype._transform = function (data, encoding, done) {
	if (!data || data.length === 0) return done()

	// Buffer the incoming data
	this.buffer = Buffer.concat(
		[ this.buffer, data ]
	, this.buffer.length + data.length
	)

	this._flush(done)
}

Decoder.prototype._flush = function (done) {
	var n = this.buffer.length

	if (n === 0) return done()

	switch (this.state) {
		case 0:
			if (n < 4) break
			if ( this.buffer.readUInt32LE(0, true) !== ARCHIVE_MAGICNUMBER )
				return done( null, new Error('LZ4StreamDecoder#write: Invalid magic number') )

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

			var buf = new Buffer(this.chunkSize)
			var decodedSize = LZ4_uncompressChunk( this.buffer.slice(4, this.size + 4), buf )

			if (decodedSize < 0)
				return done( null, new Error('LZ4StreamDecoder#write: Invalid data at ' + (-decodedSize)) )

			this.push( decodedSize < this.chunkSize ? buf.slice(0, decodedSize) : buf )
			this.buffer = this.buffer.slice(this.size + 4)

			this.state = 1
		break
		default:
			return done( null, new Error('LZ4StreamDecoder#write: Invalid state: ' + this.state) )
	}
	
	done()
}

module.exports = Decoder