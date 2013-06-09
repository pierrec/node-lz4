var Transform = require('stream').Transform
var inherits = require('util').inherits

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
	
	Transform.call(this, options)
	// Options
	options = options || {}
	this.chunkSize = options.chunkSize || DEFAULT_CHUNKSIZE
	this.compress = options.hc ? LZ4_compressHCChunk : LZ4_compressChunk

	// Data being processed
	this.buffer = []
	this.length = 0

	this.first = true
	this.chunkBound = LZ4_compressBound(this.chunkSize) + 4
	this.ending = false
}
inherits(Encoder, Transform)

Encoder.prototype._transform = function (data, encoding, done) {
	// Buffer the incoming data
	this.buffer.push(data)
	this.length += data.length

	if (this.first) {
		var buf = new Buffer(4)
		buf.writeUInt32LE(ARCHIVE_MAGICNUMBER, 0, false)
		this.push(buf)
		this.first = false
	}

	if ( this.length < this.chunkSize ) return done()

	this._compressChunk(this.chunkSize, done)
}

Encoder.prototype._flush = function (done) {
	if (this.length === 0) return done()

	while ( this.length > this.chunkSize ) {
		this._compressChunk(this.chunkSize)
	}

	this._compressChunk(this.length, done)
}

Encoder.prototype._compressChunk = function (size, done) {
	var buf = new Buffer(this.chunkBound)
	var input = Buffer.concat(this.buffer, this.length)
	var res = this.compress( input.slice(0, size), buf.slice(4) )
	if (res === 0)
		return done( null, new Error('Compression error') )

	buf.writeUInt32LE(res, 0, false)
	this.push( buf.slice(0, res + 4) )

	this.length = input.length - size
	this.buffer = this.length > 0 ? [ input.slice(size) ] : []

	if (done) done()
}

module.exports = Encoder
