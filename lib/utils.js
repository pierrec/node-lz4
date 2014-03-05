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
	if (d === null)
		return XXH.digest(c)

	if (c === null)
		c = XXH.init(CHECKSUM_SEED)

	XXH.update(c, d)

	return c
}

exports.bindings = require('../build/Release/lz4')
