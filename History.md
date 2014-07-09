0.3.11 / 2014-07-09
===================

* Updated LZ4 source to r119

0.3.10 / 2014-07-09
===================

* Removed garbage in build/lz4.min.js by updating minify to latest version

0.3.9 / 2014-07-06
==================

* Fixed checksum errors in the decoder (browser implementation) (issue #14)
* Added start and end indexes to decodeBlock() and encodeBlock() (issue #15)

0.3.8 / 2014-05-21
==================

* Fixed issue where the browser implementation of Buffer checks sign in writeUInt32LE()

0.3.7 / 2014-05-20
==================

* Fixed assert() when writing uncompressible data

0.3.6 / 2014-04-11
==================

* Added useJS option to encoder and decoder streams

0.3.5 / 2014-04-11
==================

* Fixed stream encoder typo

0.3.4 / 2014-04-07
==================

* Updated lz4 source to r116
* Fixed stream encoder on large inputs

0.3.3 / 2014-03-28
==================

* Updated build/lz4.js and build/lz4.min.js

0.3.2 / 2014-03-27
==================

* Fixed Javascript compressBlock() not writing last batch of literals under some circumstances

0.3.1 / 2014-03-18
==================

* Improved Javascript encoder speed

0.3.0 / 2014-03-11
==================

* First release of the pure Javascript encoder

0.2.4 / 2014-03-05
==================

* Updated lz4 source to r113
* Split xxHash and LZ4 bindings
* Added browser support via ./build/lz4.js and ./build/lz4.min.js
* Exposed block level compression/decompression functions

0.2.3 / 2013-12-15
==================

* Fixed handling of uncompressed data
* Sync and async encoders share the same code

0.2.2 / 2013-10-04
==================

* Sync and async decoders share the same code
* Async decoder emits an error on missing data

0.2.1 / 2013-10-03
==================

* Fixed encoder reversed logic

0.2.0 / 2013-10-01
==================

* Updated lz4 source to r104
* Support for LZ4Stream format v1.4, legacy format is deprecated, use v0.1 for its support

0.1.2 / 2013-09-09
==================

* Updated lz4 source to r102

0.1.1 / 2013-06-09
==================

* Updated lz4 source to r96
* Fixed an issue with small chunkSize parameters

0.1.0 / 2013-03-13
==================

* Updated streams to use streams2

0.0.5 / 2013-03-12
==================

* Updated lz4 source to r90
* Fixed node binding compilation errors for node v0.10
