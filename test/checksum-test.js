var fs = require('fs')
var assert = require('assert')


describe('LZ4 checksum', function () {
  var lz4 = require('..')

  it('should encode/decode data', function (done) {
    var data = Buffer.alloc(200)
    data.fill(0)

    lz4.decode(lz4.encode(data))

    done()
  })

  it('should encode/decode data', function (done) {
    var data = Buffer.alloc(200)
    data.fill(16)

    lz4.decode(lz4.encode(data))

    done()
  })

  it('should encode/decode data', function (done) {
    var data = Buffer.alloc(200)
    data.slice(0, 100).fill(0)
    data.slice(100).fill(16)

    lz4.decode(lz4.encode(data))

    done()
  })

})