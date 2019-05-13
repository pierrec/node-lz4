/**
 * Native bindings
 */
var XXH = require('../build/Release/xxhash')

var CHECKSUM_SEED = 0

// Header checksum is second byte of xxhash using 0 as a seed
exports.descriptorChecksum = function (d) {
	return (XXH.xxHash(d, CHECKSUM_SEED) >> 8) & 0xFF
}

exports.blockChecksum = function (d) {
	return XXH.xxHash(d, CHECKSUM_SEED)
}

exports.streamChecksum = function (d, c) {
	if (c === null)
		c = XXH.init(CHECKSUM_SEED)

	if (d === null)
		return XXH.digest(c)

	XXH.update(c, d)

	return c
}

// Provide simple readUInt32LE as the Buffer ones from node and browserify are incompatible
exports.readUInt32LE = function (buffer, offset) {
	// this is nodejs Buffer.readUInt32LE() implementation...
	const val = ((buffer[offset]) |
      (buffer[offset + 1] << 8) |
      (buffer[offset + 2] << 16)) +
	  (buffer[offset + 3] * 0x1000000)
	// bitwise operators operate on signed values, this trick returns the result unsigned
	return val >>> 0;
}

exports.bindings = require('../build/Release/lz4')
