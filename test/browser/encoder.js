describe('Browser encoding', function () {
  var lz4 = require('lz4')
  var Buffer = require('buffer').Buffer

  describe('sync', function () {
    it('should encode short uncompressible string', function () {
      lz4.encode('Test')
    })

    it('should encode test data', function () {
      var decoded_data, encoded_data

      downloadDataFile('test', 'text', function (response) {
        decoded_data = response
      })

      downloadDataFile('test.lz4', 'arraybuffer', function (response) {
        encoded_data = new Buffer(new Uint8Array(response))
      })

      runs(function () {
        expect(decoded_data).toBeDefined()
        expect(encoded_data).toBeDefined()
        expect(lz4.encode(decoded_data)).toBeDefined()
      })
    })
  })
})