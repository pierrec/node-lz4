var Transform = require('stream').Transform
var inherits = require('util').inherits

var LZ4Stream = require('./encoder').LZ4Stream
var lz4_static = require('./static')

/**
	Build up blocks and encode them one by one as they are assembled
 */
function Encoder (options) {
	if ( !(this instanceof Encoder) )
		return new Encoder(options)
	
	Transform.call(this, options)
	LZ4Stream.call(this, options)

	// Data being processed
	this.buffer = []
	this.length = 0

	this.first = true
	this.fast = !this.options.streamSize
}
inherits(Encoder, Transform)
Object.keys(LZ4Stream.prototype).forEach(function(method) {
  if (!Encoder.prototype[method])
    Encoder.prototype[method] = LZ4Stream.prototype[method];
});

Encoder.prototype._transform = function (data, encoding, done) {
	// Buffer the incoming data
	this.buffer.push(data)
	this.length += data.length

	var blockMaxSize = this.options.blockMaxSize

	// Not enough data for a block
	if ( this.length < blockMaxSize ) return done()

	// Build the data to be compressed
	var buf = Buffer.concat(this.buffer, this.length)

	// Compress the block
	this.add( buf.slice(0, blockMaxSize) )

	// Set the remaining data
	if (buf.length > blockMaxSize) {
		this.buffer = [ buf.slice(blockMaxSize) ]
		this.length = buf.length - blockMaxSize
	} else {
		this.buffer = []
		this.length = 0
	}

	if (this.fast) {
		if (this.first) {
			this.push( this.header() )
			this.first = false
		}
		this.push( this.shiftBlock() )
	}

	done()
}

Encoder.prototype._flush = function (done) {
	if (this.length > 0)
		this.add( Buffer.concat(this.buffer, this.length) )

	if (this.fast) {
		if (this.first) {
			this.push( this.header() )
			this.first = false
		}
		var block
		while ( block = this.shiftBlock() ) this.push(block)
		this.push( this.tail() )
	} else {
		this.push( this.done() )
	}

	done()
}

module.exports = Encoder
