var fs = require('fs')
var assert = require('assert')
var lz4 = require('..')

describe('LZ4 decoder', function () {
  var decoded_data = fs.readFileSync( __dirname + '/../data/test' ).toString().replace(/\r/g, '') // cleanup line endings
  var decoded_data_medium = fs.readFileSync( __dirname + '/../data/test_medium' ).toString().replace(/\r/g, '') // cleanup line endings
  var encoded_data = fs.readFileSync( __dirname + '/../data/test.lz4' )

  describe('sync', function () {
    it('should decode data', function (done) {
      var decoded = lz4.decode(encoded_data)

      assert.equal( decoded_data, decoded.toString() )
      done()
    })
  })

  describe('async', function () {
    it('should decode data', function (done) {
      var input = fs.createReadStream( __dirname + '/../data/test.lz4' )
      var decoder = lz4.createDecoderStream()
      var decoded = ''

      function add (data) {
      	if (data) decoded += data.toString()
      }
      decoder.on('data', add)
      decoder.on('end', add)
      decoder.on('end', function () {
      	assert.equal( decoded_data, decoded )
      	done()
      })

      input.pipe(decoder)
    })

    it('should decode data with small stream chunks', function (done) {
      var input = fs.createReadStream( __dirname + '/../data/test_medium.lz4', { bufferSize: 1024 } )
      var decoder = lz4.createDecoderStream()
      var decoded = ''

      function add (data) {
        if (data) decoded += data.toString()
      }
      decoder.on('data', add)
      decoder.on('end', add)
      decoder.on('end', function () {
        assert.equal( decoded_data_medium, decoded )
        done()
      })

      input.pipe(decoder)
    })
  })
})