# LZ4

[LZ4](http://fastcompression.blogspot.fr/) is a very fast compression and decompression algorithm. This nodejs module provides a Javascript implementation of the decoder as well as native bindings to the LZ4 functions. Nodejs Streams are also supported for compression and decompression.


## Install

	npm install lz4


## Usage

### Encoding

There are 2 ways to encode:

* __asynchronous__ using nodejs Streams - slowest but can handle very large data sets (no memory limitations). NB. encoding via streams is __extremely__ slow at the moment.
* __synchronous__ by feeding the whole set of data - faster but is limited by the amount of memory

Either way, the encoder takes the following options:

* `chunkSize` (_Number_): number of bytes used to chunk the data (default=8Mb)


#### Asynchronous encoding

First, create an LZ4 encoding stream with `LZ4#createEncoderStream()`.
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

Read the data into memory and feed it to `LZ4#encode()`.

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

Either way, there are 2 options that the decoder takes:

* `chunkSize` (_Number_): number of bytes that was used to compress the data (default=8Mb)
* `outputSize` (_Number_): number of bytes for the output buffer (default=`chunkSize`)


#### Asynchronous decoding

First, create an LZ4 decoding stream with `LZ4#createDecoderStream()`.
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

Read the data into memory and feed it to `LZ4#decode()`.

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

* LZ4 streams have only been tested using `bin/lz4demo32`, not `bin/lz4demo64`.
* Encoding streams is __extremely__ slow

## License

MIT