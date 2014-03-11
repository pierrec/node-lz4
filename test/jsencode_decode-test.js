/**
 * Test Javascript based encoding
 */
var fs = require('fs')
var assert = require('assert')

var lz4 = require('../lib/binding')

describe('LZ4 js encoder', function () {

  function compare (a, b) {
    if (a.length !== b.length) return false

    for (var i = 0, n = a.length; i < n; i++) {
      if (a[i] !== b[i]) return false
    }

    return true
  }

  var data = fs.readFileSync( __dirname + '/../data/test' )

  it('should encode/decode data', function (done) {
    var maxSize = lz4.compressBound(data.length)
    
    var jsencoded = new Buffer(maxSize)
    var jsencodedSize = lz4.compress(data, jsencoded)

    assert( jsencodedSize > 0 )
    jsencoded = jsencoded.slice(0, jsencodedSize)

    var jsdecoded = new Buffer(data.length)
    var jsdecodedSize = lz4.uncompress(jsencoded, jsdecoded)

    assert( jsdecodedSize > 0 )

    assert(
      compare(
        data
      , jsdecoded.slice(0, jsdecodedSize)
      )
    )
    done()
  })

})