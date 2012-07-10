var fs = require('fs')
var assert = require('assert')

var lz4 = require('..')

describe('LZ4 decoder', function () {
  var data = fs.readFileSync( __dirname + '/../data/test' )
  var encoded_data = fs.readFileSync( __dirname + '/../data/test.lz4' )

  describe('sync', function () {
    it('should decode data', function (done) {
      var decoded = lz4.decode(encoded_data)

      assert( data.toString() === decoded.toString() )
      done()
    })
  })
})