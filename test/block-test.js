var fs = require('fs')
var assert = require('assert')

var lz4 = require('..')

describe('LZ4 block encoder/decoder', function () {
  var decoded_data_valid = fs.readFileSync( __dirname + '/../data/test' )

  it('should encode/decode data', function (done) {
    var encoded_data = Buffer.alloc( lz4.encodeBound(decoded_data_valid.length) )
    var n = lz4.encodeBlock(decoded_data_valid, encoded_data)

    assert( n > 0 )
    encoded_data = encoded_data.slice(0, n)

    var decoded_data = Buffer.alloc(decoded_data_valid.length)
    n = lz4.decodeBlock(encoded_data, decoded_data)
    assert( n === decoded_data_valid.length )
    assert( decoded_data.toString() === decoded_data_valid.toString() )

    done()
  })

})