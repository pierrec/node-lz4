var fs = require('fs')
var assert = require('assert')

var lz4 = require('..')

describe('LZ4 encoder', function () {
  var encoded_data = fs.readFileSync( __dirname + '/../data/test.lz4' )
  var smallChunk_encoded_data = fs.readFileSync( __dirname + '/../data/test_smallchunk.lz4' )
  var encodedHC_data = fs.readFileSync( __dirname + '/../data/testHC.lz4' )

  function compare (a, b) {
    if (a.length !== b.length) return false

    for (var i = 0, n = a.length; i < n; i++) {
      if (a[i] !== b[i]) return false
    }

    return true
  }

  describe('sync', function () {
    var decoded_data = fs.readFileSync( __dirname + '/../data/test' )

    describe('encoding', function () {
      it('should encode data', function (done) {
        var encoded = lz4.encode(decoded_data)

        assert( compare(encoded, encoded_data) )
        done()
      })
    })

    describe('HC encoding', function () {
      it('should encode data', function (done) {
        var encoded = lz4.encode(decoded_data, { highCompression: true })

        assert( compare(encoded, encodedHC_data) )
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
          assert( compare(Buffer.concat(encoded), encoded_data) )
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
          assert( compare(Buffer.concat(encoded), smallChunk_encoded_data) )
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
          assert( compare(Buffer.concat(encoded), encodedHC_data) )
          done()
        })

        input.pipe(encoder)
      })
    })
  })
})