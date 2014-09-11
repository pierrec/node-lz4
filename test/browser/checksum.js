describe('Browser checksum', function () {
  var lz4 = require('lz4')
  var Buffer = require('buffer').Buffer

  it('should encode/decode test data', function () {
    runs(function () {
      var data = new Buffer(200)
      data.fill(0)

      lz4.decode(lz4.encode(data))
    })
  })

  it('should encode/decode test data', function () {
    runs(function () {
      var data = new Buffer(200)
      data.fill(16)

      lz4.decode(lz4.encode(data))
    })
  })

  it('should encode/decode test data', function () {
    runs(function () {
      var data = new Buffer(200)
      data.slice(0, 100).fill(0)
      data.slice(100).fill(16)

      lz4.decode(lz4.encode(data))
    })
  })

})