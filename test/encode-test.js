var fs = require('fs')
var assert = require('assert')

var lz4 = require('..')

describe('LZ4 encoder', function () {
  var data = fs.readFileSync( __dirname + '/../data/test' )

  describe('sync', function () {
    var encoded_data = fs.readFileSync( __dirname + '/../data/test.lz4' )
    it('should encode data', function (done) {
      var encoded = lz4.encode(data)

      var same = true

      if (encoded.length === encoded_data.length) {
        for (var i = 0, n = encoded.length; i < n; i++)
          if (encoded[i] !== encoded_data[i]) {
            same = false
            break
          }
      } else {
        same = false
      }

      assert( same )
      done()
    })
  })

  describe('HC sync', function () {
    var encoded_data = fs.readFileSync( __dirname + '/../data/testHC.lz4' )
    it('should encode data', function (done) {
      var encoded = lz4.encode(data, true)

      var same = true

      if (encoded.length === encoded_data.length) {
        for (var i = 0, n = encoded.length; i < n; i++)
          if (encoded[i] !== encoded_data[i]) {
            same = false
            break
          }
      } else {
        same = false
      }

      assert( same )
      done()
    })
  })
})