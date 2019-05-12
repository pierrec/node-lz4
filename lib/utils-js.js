/**
 * Javascript emulated bindings
 */
var XXH = require('xxhashjs').h32 // XXX .h64

var CHECKSUM_SEED = 0

// Header checksum is second byte of xxhash using 0 as a seed
exports.descriptorChecksum = function (d) {
	return (XXH(d, CHECKSUM_SEED).toNumber() >> 8) & 0xFF
}

exports.blockChecksum = function (d) {
	return XXH(d, CHECKSUM_SEED).toNumber()
}

exports.streamChecksum = function (d, c) {
	if (d === null)
		return c.digest().toNumber()

	if (c === null)
		c = XXH(CHECKSUM_SEED)

	return c.update(d)
}

// Provide simple readUInt32LE as the Buffer ones from node and browserify are incompatible
exports.readUInt32LE = function (buffer, offset) {
	const val = (buffer[offset]) |
      (buffer[offset + 1] << 8) |
      (buffer[offset + 2] << 16) |
      (buffer[offset + 3] << 24)
	// bitwise operators operate on signed values, this trick returns the result unsigned
	return val >>> 0;
}

exports.bindings = require('./binding')
