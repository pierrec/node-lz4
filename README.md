# LZ4

[LZ4](http://fastcompression.blogspot.fr/) is a very fast compression and decompression algorithm. This nodejs module provides a Javascript implementation of it, currently limited on decompression. Direct bindings may be provided in the future.

This is very much a __work in progress__.


## Install

	npm install lz4


## Usage

### Decoding

There are 2 ways to decode:

* __asynchronous__ using nodejs Streams - slowest but can handle very large data sets (no memory limitations)
* __synchronous__ by feeding the whole LZ4 data - faster but is limited by the amount of memory

Either way, there are 2 options that the decoder takes:

* `chunkSize` (_Number_): number of bytes that was used to compress the data (default=8Mb)
* `incrementSize` (_Number_): number of bytes by which to increment the output buffer if it becomes full and there is still data to decode. Setting it to the right value has a significant impact on performance. If the output size is known, use it as the incrementSize value for maximum performance.


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

## Restrictions

Currently, the decoder handles pure LZ4 streams, without additional data. For instance, to compress data you can use `bin/lz4demo32`, which adds a header to the created file. In order to properly decode it with lz4-js, you need to strip it out. You can use `bin/lz4strip` for that task.

LZ4 streams have only been tested using `bin/lz4demo32`, not `bin/lz4demo64`.

## License

MIT