var fs = require('fs')
var path = require('path')
var Benchmark = require('benchmark')
var lz4 = require('..')
var lz4js = require('../lib/binding')

var inputFileName = path.normalize( process.argv[2] || __dirname + '/../data/lorem_1mb.txt' )
console.log('Input file:', inputFileName)

var input = fs.readFileSync(inputFileName)
var outputMaxSize = lz4.encodeBound(input.length)
var output = Buffer.alloc(outputMaxSize)

var decoded = Buffer.alloc(input.length)
var encoded = Buffer.alloc(outputMaxSize)
var n = lz4.encodeBlock(input, encoded)
encoded = encoded.slice(0, n)

console.log('Input size:', input.length)
console.log('Output size:', encoded.length)

var suite = new Benchmark.Suite
suite
	.add('lz4.encodeBlock native', function() {
		lz4.encodeBlock(input, output)
	})
	.add('lz4.decodeBlock native', function() {
		lz4.decodeBlock(encoded, decoded)
	})
	.add('lz4.encodeBlock JS', function() {
		lz4js.compress(input, output)
	})
	.add('lz4.decodeBlock JS', function() {
		lz4js.uncompress(encoded, decoded)
	})
	// add listeners
	.on('cycle', function(event) {
	  console.log( String(event.target) )
	})
	.run()