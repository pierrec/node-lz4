var fs = require('fs')
var assert = require('assert')

var lz4 = require('..')

describe('LZ4 encoder', function () {
  var decoded_data = fs.readFileSync( __dirname + '/../data/test' )

  function compare (a, b) {
    if (a.length !== b.length) return false

    for (var i = 0, n = a.length; i < n; i++) {
      if (a[i] !== b[i]) return false
    }

    return true
  }

  describe('sync', function () {
    describe('empty', function () {
      it('should encode no data', function (done) {
        var empty = Buffer.from("")
        var encoded = lz4.encode(empty)

        assert( compare(lz4.decode(encoded), empty) )
        done()
      })
    })

    describe('encoding', function () {
      it('should encode data', function (done) {
        var encoded = lz4.encode(decoded_data)

        assert( compare(lz4.decode(encoded), decoded_data) )
        done()
      })
    })

    describe('HC encoding', function () {
      it('should encode data', function (done) {
        var encoded = lz4.encode(decoded_data, { highCompression: true })

        assert( compare(lz4.decode(encoded), decoded_data) )
        done()
      })
    })

    describe('encoding with streamSize', function () {
      it("should encode datag", function (done) {
        var encoded = lz4.encode(decoded_data, { streamSize: true })

        assert( compare(lz4.decode(encoded), decoded_data) )
        done()
      })
    })

    // https://github.com/pierrec/node-lz4/issues/69
    describe('HC block compression', function () {
      it('decoded should match with original', function (done) {
        var str = 'a'.repeat(81) + 'XXXXXX' + 'a'.repeat(65531) + 'XXXXXXaaaaaa'
        var input = Buffer.from(str)
        var output = Buffer.alloc(lz4.encodeBound(input.length))
        var compressedSize = lz4.encodeBlockHC(input, output)
        output = output.slice(0, compressedSize)

        var uncompressed = Buffer.alloc(input.length)
        var uncompressedSize = lz4.decodeBlock(output, uncompressed)
        uncompressed = uncompressed.slice(0, uncompressedSize)

        assert( compare(input, uncompressed) )
        done()
      })
    })
  })

  describe('async', function () {
    describe('encoding', function () {
      it('should encode data', function (done) {
        var input = fs.createReadStream( __dirname + '/../data/test' )
        var encoder = lz4.createEncoderStream()
        var encoded = []

        function add (chunk) {
          if (chunk) encoded.push(chunk)
        }

        encoder.on('data', add)
        encoder.on('end', add)
        encoder.on('end', function () {
          assert( compare(lz4.decode(Buffer.concat(encoded)), decoded_data) )
          done()
        })

        input.pipe(encoder)
      })
    })

    describe('encoding with small chunk size', function () {
      it('should encode data', function (done) {
        var input = fs.createReadStream( __dirname + '/../data/test' )
        var encoder = lz4.createEncoderStream({ blockMaxSize: 64<<10 })
        var encoded = []

        function add (chunk) {
          if (chunk) encoded.push(chunk)
        }

        encoder.on('data', add)
        encoder.on('end', add)
        encoder.on('end', function () {
          assert( compare(lz4.decode(Buffer.concat(encoded)), decoded_data) )
          done()
        })

        input.pipe(encoder)
      })
    })

    describe('HC encoding', function () {
      it('should encode data', function (done) {
        var input = fs.createReadStream( __dirname + '/../data/test' )
        var encoder = lz4.createEncoderStream({ highCompression: true })
        var encoded = []

        function add (chunk) {
          if (chunk) encoded.push(chunk)
        }

        encoder.on('data', add)
        encoder.on('end', add)
        encoder.on('end', function () {
          assert( compare(lz4.decode(Buffer.concat(encoded)), decoded_data) )
          done()
        })

        input.pipe(encoder)
      })
    })
  })
})
