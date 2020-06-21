describe('Browser block encoding/decoding', function () {
  var lz4 = require('lz4')
  var Buffer = require('buffer').Buffer

  describe('block', function () {
    it('should encode short uncompressible string', function () {
      lz4.encodeBlock(Buffer.from('Test'), Buffer.alloc(32))
    })

    it('should encode/decode test data', function () {
      var decoded_data_valid

      downloadDataFile('test', 'arraybuffer', function (response) {
        decoded_data_valid = Buffer.from(new Uint8Array(response))
      })

      runs(function () {
        expect(decoded_data_valid).toBeDefined()

        var encoded_data = Buffer.alloc(lz4.encodeBound(decoded_data_valid.length))
        var decoded_data = Buffer.alloc(decoded_data_valid.length)

        expect(encoded_data).toBeDefined()
        expect(decoded_data).toBeDefined()

        var n = lz4.encodeBlock(decoded_data_valid, encoded_data)
        expect(n).toBeDefined()
        if (n > 0) {
          encoded_data = encoded_data.slice(0, n)
          n = lz4.decodeBlock(encoded_data, decoded_data)

          expect(n).toEqual(decoded_data_valid.length)

          decoded_data = decoded_data.slice(0, n)
          expect( decoded_data.toString() ).toEqual( decoded_data_valid.toString() )
        }
      })
    })

    it('should encode/decode test data', function () {
      var decoded_data_valid

      downloadDataFile('test', 'arraybuffer', function (response) {
        decoded_data_valid = Buffer.from(new Uint8Array(response))
      })

      runs(function () {
        expect(decoded_data_valid).toBeDefined()

        var encoded_data = Buffer.alloc(lz4.encodeBound(decoded_data_valid.length) + 4)
        var decoded_data = Buffer.alloc(decoded_data_valid.length)

        expect(encoded_data).toBeDefined()
        expect(decoded_data).toBeDefined()

        var n = lz4.encodeBlock(decoded_data_valid, encoded_data, 4)
        expect(n).toBeDefined()
        if (n > 0) {
          encoded_data = encoded_data.slice(4, n)
          n = lz4.decodeBlock(encoded_data, decoded_data)

          expect(n).toEqual(decoded_data_valid.length)

          decoded_data = decoded_data.slice(0, n)
          expect( decoded_data.toString() ).toEqual( decoded_data_valid.toString() )
        }
      })
    })
  })
})