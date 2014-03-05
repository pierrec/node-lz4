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
