var Stream = require('stream')
var inherits = require('inherits')

var decoder = require('./decoder')
var decodeChunk = decoder.decodeChunk
var ARCHIVE_MAGICNUMBER = decoder.ARCHIVE_MAGICNUMBER

/**
	Build up chunks and decode them one by one as they are assembled
 */
function Decoder (options) {
	if ( !(this instanceof Decoder) )
		return new Decoder(options)
	
	// Options
	options = options || {}
	this.chunkSize = options.chunkSize || (8 << 20) // 8Mb by default

	// Stream states
	this.readable = true
	this.writable = true
	this.ended = false
	this.paused = false
	this.needDrain = false

	// Encoded data being processed
//TODO: check performance with [] instead of pre constructed Array
	this._bufferList = new Array(2)		// Reuse array when concatenating Buffers
	this.buffer = this._bufferList[0] = new Buffer(0)
	this.length = 0
	this.literalsIndex = 0
	this.state = 0 // 0: magic number(4), 1: chunk size(4), 2: sequences
	this.toRead = 0

	// Decoded data for the __current chunk__ - size will be increased automatically
	this.decoded = null
	this.decodedIndex = 0
}

Decoder.prototype.write = function (data) {
  if (data) {
  	// Buffer the incoming data
		this.length += data.length
		this._bufferList[1] = data
		this.buffer = this._bufferList[0] = Buffer.concat( this._bufferList, this.length )
	}

	if (this.paused) {
		this.needDrain = true
		return false
	}

	var input = this.buffer
	var n = this.length

	if (n === 0) return true


	switch (this.state) {
		case 0:
			if (n < 4) return true
			this.state++
			if (n === 4) return true
			this.length = ( n -= 4 )
			this.buffer = input = input.slice(4)
		case 1:
			if (n < 4) return true
			this.state++
			if (n === 4) return true
			// Encoded size
			for (var i = 0; i < 4; i++)
				this.toRead += (input[i] << (8 * i))
			this.length = ( n -= 4 )
			this.buffer = input = input.slice(4)
		case 2:
		default:
			this.emit( 'error', new Error('Invalid state: ' + this.state) )
	}


	
	// Decoded data
	if (this.decodedIndex < j) {
		// Emit new data
		this.emit('data', output.slice(this.decodedIndex, j))

		this.decoded = output
		this.decodedIndex = j
	}

	if (sequenceIndex > 0) {
		this.literalsIndex = _i - sequenceIndex
		this.buffer = this._bufferList[0] = this.buffer.slice(sequenceIndex)
		this.length = this.buffer.length
	}

	if (this.needDrain) {
    this.needDrain = false
    this.emit('drain')
  }

  return true
}
Decoder.prototype.write_end = function () {
	this.emit( 'error', new Error('Decoder#write: write after end') )
	return false
}

Decoder.prototype.end = function (data) {
	if (data) this.write(data)

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

exports.createDecoderStream = Decoder
