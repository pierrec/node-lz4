var lz4_binding = require('./static').bindings

var CHECKSUM_SEED = 0

// Header checksum is second byte of xxhash using 0 as a seed
exports.descriptorChecksum = function (d) {
	return (lz4_binding.xxHash(d, CHECKSUM_SEED) >> 8) & 0xFF
}

exports.blockChecksum = function (d) {
	return lz4_binding.xxHash(d, CHECKSUM_SEED)
}

exports.streamChecksum = function (d, c) {
	if (d === null)
		return lz4_binding.xxHash_digest(c)

	if (c === null)
		c = lz4_binding.xxHash_init(CHECKSUM_SEED)

	lz4_binding.xxHash_update(c, d)

	return c
}
