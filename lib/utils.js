/**
 * Native bindings
 */
//var XXH = require('../build/Release/xxhash')
//var bindings = require('../build/Release/lz4')
var binary = require('node-pre-gyp');
var path = require('path');
var binding_path = binary.find(path.resolve(path.join(__dirname, '../package.json')));
var bindings = require(binding_path);

var CHECKSUM_SEED = 0

// Header checksum is second byte of xxhash using 0 as a seed
exports.descriptorChecksum = function (d) {
	return (bindings.xxHash(d, CHECKSUM_SEED) >> 8) & 0xFF
}

exports.blockChecksum = function (d) {
	return bindings.xxHash(d, CHECKSUM_SEED)
}

exports.streamChecksum = function (d, c) {
	if (c === null)
		c = bindings.init(CHECKSUM_SEED)

	if (d === null)
		return bindings.digest(c)

	bindings.update(c, d)

	return c
}

// Provide simple readUInt32LE as the Buffer ones from node and browserify are incompatible
exports.readUInt32LE = function (buffer, offset) {
	// this is nodejs Buffer.readUInt32LE() implementation...
	return ((buffer[offset]) |
      (buffer[offset + 1] << 8) |
      (buffer[offset + 2] << 16)) +
	  (buffer[offset + 3] * 0x1000000)
}

exports.bindings = bindings
