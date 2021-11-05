var assert = require('assert')


describe('LZ4 checksum', function () {
  var lz4 = require('..')

  it('should encode/decode data', function () {
    var data = Buffer.alloc(200)
    data.fill(0)

    assert.deepEqual(lz4.decode(lz4.encode(data, { blockChecksum: true })), data)
  })

  it('should encode/decode data', function () {
    var data = Buffer.alloc(200)
    data.fill(16)

    assert.deepEqual(lz4.decode(lz4.encode(data, { blockChecksum: true })), data)
  })

  it('should encode/decode data', function () {
    var data = Buffer.alloc(200)
    data.slice(0, 100).fill(0)
    data.slice(100).fill(16)

    assert.deepEqual(lz4.decode(lz4.encode(data, { blockChecksum: true })), data)
  })

  it('should encode/decode data #107', function () {
    const data = Buffer.from('Lorem ipsum dolor sit amet, consectetur adipiscing elit.')

    assert.deepEqual(lz4.decode(lz4.encode(data, { blockChecksum: true })), data)
  })

})