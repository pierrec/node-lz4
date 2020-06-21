# LZ4

[LZ4](http://fastcompression.blogspot.fr/) is a very fast compression and decompression algorithm. This nodejs module provides a Javascript implementation of the decoder as well as native bindings to the LZ4 functions. Nodejs Streams are also supported for compression and decompression.

NB.
Version 0.2 does not support the legacy format, only the one as of "LZ4 Streaming Format 1.4". Use version 0.1 if required.

## Build

With NodeJS:

```shell
git clone https://github.com/pierrec/node-lz4.git
cd node-lz4
git submodule update --init --recursive
npm install
```

## Install

With NodeJS:

```shell
npm install lz4
```

Within the browser, using `build/lz4.js`:

```html
<script type="text/javascript" src="/path/to/lz4.js"></script>
<script type="text/javascript">
// Nodejs-like Buffer built-in
var Buffer = require('buffer').Buffer
var LZ4 = require('lz4')

// Some data to be compressed
var data = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
data += data
// LZ4 can only work on Buffers
var input = Buffer.from(data)
// Initialize the output buffer to its maximum length based on the input data
var output = Buffer.alloc( LZ4.encodeBound(input.length) )

// block compression (no archive format)
var compressedSize = LZ4.encodeBlock(input, output)
// remove unnecessary bytes
output = output.slice(0, compressedSize)

console.log( "compressed data", output )

// block decompression (no archive format)
var uncompressed = Buffer.alloc(input.length)
var uncompressedSize = LZ4.decodeBlock(output, uncompressed)
uncompressed = uncompressed.slice(0, uncompressedSize)

console.log( "uncompressed data", uncompressed )
</script>
```


From github cloning, after having made sure that node and node-gyp are properly installed:

```shell
npm i
node-gyp rebuild
```

See below for more LZ4 functions.


## Usage

### Encoding

There are 2 ways to encode:

* __asynchronous__ using nodejs Streams - slowest but can handle very large data sets (no memory limitations).
* __synchronous__ by feeding the whole set of data - faster but is limited by the amount of memory


#### Asynchronous encoding

First, create an LZ4 encoding NodeJS stream with `LZ4#createEncoderStream(options)`.

* `options` (_Object_): LZ4 stream options (optional)
	* `options.blockMaxSize` (_Number_): chunk size to use (default=4Mb)
	* `options.highCompression` (_Boolean_): use high compression (default=false)
	* `options.blockIndependence` (_Boolean_): (default=true)
	* `options.blockChecksum` (_Boolean_): add compressed blocks checksum (default=false)
	* `options.streamSize` (_Boolean_): add full LZ4 stream size (default=false)
	* `options.streamChecksum` (_Boolean_): add full LZ4 stream checksum (default=true)
	* `options.dict` (_Boolean_): use dictionary (default=false)
	* `options.dictId` (_Integer_): dictionary id (default=0)


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

## Block level encoding/decoding

In some cases, it is useful to be able to manipulate an LZ4 block instead of an LZ4 stream. The functions to decode and encode are therefore exposed as:

* `LZ4#decodeBlock(input, output[, startIdx, endIdx])` (_Number_) >=0: uncompressed size, <0: error at offset
	* `input` (_Buffer_): data block to decode
	* `output` (_Buffer_): decoded data block
	* `startIdx` (_Number_): input buffer start index (optional, default=0)
	* `endIdx` (_Number_): input buffer end index (optional, default=startIdx + input.length)
* `LZ4#encodeBound(inputSize)` (_Number_): maximum size for a compressed block
	* `inputSize` (_Number_) size of the input, 0 if too large
	This is required to size the buffer for a block encoded data
* `LZ4#encodeBlock(input, output[, startIdx, endIdx])` (_Number_) >0: compressed size, =0: not compressible
	* `input` (_Buffer_): data block to encode
	* `output` (_Buffer_): encoded data block
	* `startIdx` (_Number_): output buffer start index (optional, default=0)
	* `endIdx` (_Number_): output buffer end index (optional, default=startIdx + output.length)
* `LZ4#encodeBlockHC(input, output)` (_Number_) >0: compressed size, =0: not compressible
	* `input` (_Buffer_): data block to encode with high compression
	* `output` (_Buffer_): encoded data block


Blocks do not have any magic number and are provided as is. It is useful to store somewhere the size of the original input for decoding.
LZ4#encodeBlockHC() is not available as pure Javascript.


## How it works

* [LZ4 stream format](http://fastcompression.blogspot.fr/2011/05/lz4-explained.html)

## Restrictions / Issues

* `blockIndependence` property only supported for `true`


## License

MIT
