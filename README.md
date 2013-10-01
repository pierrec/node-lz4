# LZ4

[LZ4](http://fastcompression.blogspot.fr/) is a very fast compression and decompression algorithm. This nodejs module provides a Javascript implementation of the decoder as well as native bindings to the LZ4 functions. Nodejs Streams are also supported for compression and decompression.

NB.
Version 0.2 does not support the legacy format, only the one as of "LZ4 Streaming Format 1.4". Use version 0.1 if required.


## Install

	npm install lz4


## Usage

### Encoding

There are 2 ways to encode:

* __asynchronous__ using nodejs Streams - slowest but can handle very large data sets (no memory limitations).
* __synchronous__ by feeding the whole set of data - faster but is limited by the amount of memory


#### Asynchronous encoding

First, create an LZ4 encoding NodeJS stream with `LZ4#createEncoderStream(options)`.

* `options.chunkSize` (_Number_): chunk size to use (default=8Mb) (optional)
* `options.hc` (_Boolean_): use high compression (default=false) (optional)


The stream can then encode any data piped to it. It will emit a `data` event on each encoded chunk, which can be saved into an output stream.

The following example shows how to encode a file `test` into `test.lz4`.


```javascript
var fs = require('fs')
var lz4 = require('lz4')

var encoder = lz4.createEncoderStream()

var input = fs.createReadStream('test')
var output = fs.createWriteStream('test.lz4')

input.pipe(encoder).pipe(output)

```

#### Synchronous encoding

Read the data into memory and feed it to `LZ4#encode(input[, options])` to decode an LZ4 stream.

* `input` (_Buffer_): data to encode
* `options` (_Object_): LZ4 stream options (optional)
	* `options.blockMaxSize` (_Number_): chunk size to use (default=4Mb)
	* `options.highCompression` (_Boolean_): use high compression (default=false)
	* `options.blockIndependence` (_Boolean_): (default=true)
	* `options.blockChecksum` (_Boolean_): add compressed blocks checksum (default=false)
	* `options.streamSize` (_Boolean_): add full LZ4 stream size (default=false)
	* `options.streamChecksum` (_Boolean_): add full LZ4 stream checksum (default=true)
	* `options.dict` (_Boolean_): use dictionary (default=false)
	* `options.dictId` (_Integer_): dictionary id (default=0)


```javascript
var fs = require('fs')
var lz4 = require('lz4')

var input = fs.readFileSync('test')
var output = lz4.encode(input)

fs.writeFileSync('test.lz4', output)

```


### Decoding

There are 2 ways to decode:

* __asynchronous__ using nodejs Streams - slowest but can handle very large data sets (no memory limitations)
* __synchronous__ by feeding the whole LZ4 data - faster but is limited by the amount of memory


#### Asynchronous decoding

First, create an LZ4 decoding NodeJS stream with `LZ4#createDecoderStream()`.


The stream can then decode any data piped to it. It will emit a `data` event on each decoded sequence, which can be saved into an output stream.

The following example shows how to decode an LZ4 compressed file `test.lz4` into `test`.


```javascript
var fs = require('fs')
var lz4 = require('lz4')

var decoder = lz4.createDecoderStream()

var input = fs.createReadStream('test.lz4')
var output = fs.createWriteStream('test')

input.pipe(decoder).pipe(output)

```

#### Synchronous decoding

Read the data into memory and feed it to `LZ4#decode(input)` to produce an LZ4 stream.

* `input` (_Buffer_): data to decode


```javascript
var fs = require('fs')
var lz4 = require('lz4')

var input = fs.readFileSync('test.lz4')
var output = lz4.decode(input)

fs.writeFileSync('test', output)

```


## How it works

* [LZ4 stream format](http://fastcompression.blogspot.fr/2011/05/lz4-explained.html)

## Restrictions / Issues


## License

MIT