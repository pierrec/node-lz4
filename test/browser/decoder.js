describe('Browser encoding', function () {
  var lz4 = require('lz4')
  var Buffer = require('buffer').Buffer

  describe('sync', function () {
    it('should be able to encode and decode collada file', function () {
      var text

      downloadDataFile('sphere.dae', 'text', function (response) {
        text = response
      })

      runs(function () {
        expect(text).toBeDefined()
        var encoded_data = lz4.encode(text)
        expect(lz4.decode(encoded_data).toString()).toEqual(text)
      })
    })

    it('should decode collada file encoded by node.js', function () {
      var decoded_data, encoded_data

      downloadDataFile('sphere.dae', 'text', function (response) {
        decoded_data = response
      })

      downloadDataFile('sphere.lz4.dat', 'arraybuffer', function (response) {
        encoded_data = Buffer.from(new Uint8Array(response))
      })

      runs(function () {
        expect(decoded_data).toBeDefined()
        expect(encoded_data).toBeDefined()
        expect(lz4.decode(encoded_data).toString()).toEqual(decoded_data)
      })
    })
  })
})