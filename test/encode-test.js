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