// Based off of buffer.js in the Node project(copyright Joyent, Inc. and other Node contributors.)
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
;
(function () {
    "use strict";

    function isArrayIsh(subject) {
        return Buffer.isBuffer(subject) || subject && typeof subject === 'object' && typeof subject.length === 'number';
    }

    function coerce(length) {
        length = ~~Math.ceil(+length);
        return length < 0 ? 0 : length;
    }

    function ok(cond, msg) {
        if (!cond) throw new Error(msg);
    }

    var ArrayBuffer = window.ArrayBuffer ||
        function (len) {
            this.length = len;
            while (len--) this[len] = 0;
        }, Uint8Array = window.Uint8Array ||
        function (parent, offset, length) {
            this.buffer = parent;
            this.offset = offset;
            this.length = length;
        }, __set = 'Uint8Array' in window && Uint8Array.prototype.set;

    window.Uint8Array || (Uint8Array.prototype = {
        get: function (ind) {
            return this.buffer[ind + this.offset];
        },
        set: function (ind, value) {
            this.buffer[ind + this.offset] = value;
        }
    })

    var makeBuffer = function (parent, offset, length) {
            var buf = new Uint8Array(parent, offset, length);
            buf.parent = parent;
            buf.offset = offset;
            return buf;
        },

        Buffer = function (subject, encoding, offset) {
            var type, length, parent, ret;

            // Are we slicing?
            if (typeof offset === 'number') {
                length = coerce(encoding);
                parent = subject;
            } else {
                // Find the length
                switch (type = typeof subject) {
                    case 'number':
                        length = coerce(subject);
                        break;

                    case 'string':
                        length = Buffer.byteLength(subject, encoding);
                        break;

                    case 'object':
                        // Assume object is an array
                        length = coerce(subject.length);
                        break;

                    default:
                        throw new Error('First argument needs to be a number, ' + 'array or string.');
                }

                if (length > Buffer.poolSize) {
                    // Big buffer, just alloc one.
                    parent = new ArrayBuffer(length);
                    offset = 0;
                } else {
                    // Small buffer.
                    if (!pool || pool.byteLength - pool.used < length) allocPool();
                    parent = pool;
                    offset = pool.used;
                    pool.used += length;
                }

                // Treat array-ish objects as a byte array.
                if (isArrayIsh(subject)) {
                    ret = makeBuffer(parent, offset, length);
                    var i = length;
                    while (i--) {
                        ret[i] = subject[i];
                    }
                } else if (type == 'string') {
                    ret = makeBuffer(parent, offset, length);
                    length = ret.write(subject, 0, encoding);
                }
            }

            return ret || makeBuffer(parent, offset, length);
        },

        proto = Buffer.prototype = Uint8Array.prototype;

    proto.toString = function (encoding, start, end) {
        encoding = String(encoding || 'utf8').toLowerCase();
        start = +start || 0;
        if (typeof end == 'undefined') end = this.length;

        // Fastpath empty strings
        if (+end == start) {
            return '';
        }

        switch (encoding) {
            case 'hex':
                return this.hexSlice(start, end);

            case 'utf8':
            case 'utf-8':
                return this.utf8Slice(start, end);

            case 'ascii':
                return this.asciiSlice(start, end);

            case 'base64':
                return this.base64Slice(start, end);

            /*case 'binary':
             return this.binarySlice(start, end);

             case 'ucs2':
             case 'ucs-2':
             return this.ucs2Slice(start, end);*/

            default:
                throw new Error('Unknown encoding');
        }
    }

    proto.write = function (string, offset, length, encoding) {
        // Support both (string, offset, length, encoding)
        // and the legacy (string, encoding, offset, length)
        if (isFinite(offset)) {
            if (!isFinite(length)) {
                encoding = length;
                length = undefined;
            }
        } else { // legacy
            var swap = encoding;
            encoding = offset;
            offset = length;
            length = swap;
        }

        offset = +offset || 0;
        var remaining = this.length - offset;
        if (!length) {
            length = remaining;
        } else {
            length = +length;
            if (length > remaining) {
                length = remaining;
            }
        }
        encoding = String(encoding || 'utf8').toLowerCase();

        switch (encoding) {
            /*case 'hex':
             return this.hexWrite(string, offset, length);*/

            case 'utf8':
            case 'utf-8':
                return this.utf8Write(string, offset, length);

            case 'ascii':
                return this.asciiWrite(string, offset, length);

            case 'base64':
                return this.base64Write(string, offset, length);

            /*case 'binary':
             return this.binaryWrite(string, offset, length);

             case 'ucs2':
             case 'ucs-2':
             return this.ucs2Write(string, offset, length);*/

            default:
                throw new Error('Unknown encoding');
        }
    };


    var fCC = String.fromCharCode;

    proto.utf8Write = function (string, start, end) {
        for (var i = 0, l = start, le = string.length, d = end - start; i < d && i < le; i++) {
            var c = string.charCodeAt(i);

            if (c < 128) {
                this[l++] = c;
            } else if ((c > 127) && (c < 2048)) {
                this[l++] = (c >> 6) | 192;
                this[l++] = (c & 63) | 128;
            } else {
                this[l++] = (c >> 12) | 224;
                this[l++] = ((c >> 6) & 63) | 128;
                this[l++] = (c & 63) | 128;
            }
        }
        this._charsWritten = l;
        return le;
    }

    proto.utf8Slice = function (start, end) {
        for (var string = "", c, i = start, p = 0, c2, c3; p < end && (c = this[i]); i++) {
            p++;
            if (c < 128) {
                string += fCC(c);
            } else if ((c > 191) && (c < 224)) {
                c2 = this[i + 1];
                string += fCC(((c & 31) << 6) | (c2 & 63));
                i++;
            } else {
                c2 = this[i + 1];
                c3 = this[i + 2];
                string += fCC(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 2;
            }
        }
        return string;
    }

    proto.asciiWrite = function (string, start, end) {
        for (var i = 0, le = string.length; i < end && i < le; i++) {
            this[i + start] = string.charCodeAt(i);
        }
        this._charsWritten = i;
        return le;
    }

    proto.asciiSlice = function (start, end) {
        for (var string = "", i = start; i < end; i++) {
            string += fCC(this[i]);
        }
        return string;
    }

    function toHex(n) {
        if (n < 16) return '0' + n.toString(16);
        return n.toString(16);
    }

    proto.hexSlice = function (start, end) {
        var len = this.length;

        if (!start || start < 0) start = 0;
        if (!end || end < 0 || end > len) end = len;

        var out = '';
        for (var i = start; i < end; i++) {
            out += toHex(this[i]);
        }
        return out;
    };

    proto.copy = function (target, tStart, sStart, sEnd) {
        for (var i = 0, d = sEnd - sStart; i < d; i++) {
            target[i + tStart] = this[i + sStart];
        }
    }


    proto.base64Slice = function (start, end) {
        var len = this.length;

        if (!start || start < 0) start = 0;
        if (!end || end < 0 || end > len) end = len;

        var out = '';
        for (var i = start; i < end; i++) {
            out += window.btoa(this[i]);
        }
        return out;
    };

    proto.base64Write = function (string, start, end) {
        for (var i = 0, le = string.length; i < end && i < le; i++) {
            this[i + start] = window.atob( string.charCodeAt(i) );
        }
        this._charsWritten = i;
        return le;
    }



    proto.slice = function (start, end) {
        if (end === undefined) end = this.length;

        if (end > this.length) {
            throw new Error('oob');
        }
        if (start > end) {
            throw new Error('oob');
        }

        return makeBuffer(this.buffer, +start, end - start);
    };

    proto.toBlob = function () {
        var b = new (window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder);
        this.offset ? b.append(this.toString('utf8')) : b.append(this.buffer);
        return b.getBlob();
    }

    proto.readUInt8 = function (offset, noAssert) {
        var buffer = this;

        if (!noAssert) {
            ok(offset !== undefined && offset !== null,
                'missing offset');

            ok(offset < buffer.length,
                'Trying to read beyond buffer length');
        }

        return buffer[offset];
    };

    function readUInt16(buffer, offset, isBigEndian, noAssert) {
        var val = 0;


        if (!noAssert) {
            ok(typeof (isBigEndian) === 'boolean',
                'missing or invalid endian');

            ok(offset !== undefined && offset !== null,
                'missing offset');

            ok(offset + 1 < buffer.length,
                'Trying to read beyond buffer length');
        }

        if (isBigEndian) {
            val = buffer[offset] << 8;
            val |= buffer[offset + 1];
        } else {
            val = buffer[offset];
            val |= buffer[offset + 1] << 8;
        }

        return val;
    }

    proto.readUInt16LE = function (offset, noAssert) {
        return readUInt16(this, offset, false, noAssert);
    };

    proto.readUInt16BE = function (offset, noAssert) {
        return readUInt16(this, offset, true, noAssert);
    };

    function readUInt32(buffer, offset, isBigEndian, noAssert) {
        var val = 0;

        if (!noAssert) {
            ok(typeof (isBigEndian) === 'boolean',
                'missing or invalid endian');

            ok(offset !== undefined && offset !== null,
                'missing offset');

            ok(offset + 3 < buffer.length,
                'Trying to read beyond buffer length');
        }

        if (isBigEndian) {
            val = buffer[offset + 1] << 16;
            val |= buffer[offset + 2] << 8;
            val |= buffer[offset + 3];
            val = val + (buffer[offset] << 24 >>> 0);
        } else {
            val = buffer[offset + 2] << 16;
            val |= buffer[offset + 1] << 8;
            val |= buffer[offset];
            val = val + (buffer[offset + 3] << 24 >>> 0);
        }

        return val;
    }

    proto.readUInt32LE = function (offset, noAssert) {
        return readUInt32(this, offset, false, noAssert);
    };

    proto.readUInt32BE = function (offset, noAssert) {
        return readUInt32(this, offset, true, noAssert);
    };

    proto.readInt8 = function (offset, noAssert) {
        var buffer = this;
        var neg;

        if (!noAssert) {
            ok(offset !== undefined && offset !== null,
                'missing offset');

            ok(offset < buffer.length,
                'Trying to read beyond buffer length');
        }

        neg = buffer[offset] & 0x80;
        if (!neg) {
            return (buffer[offset]);
        }

        return ((0xff - buffer[offset] + 1) * -1);
    };

    function readInt16(buffer, offset, isBigEndian, noAssert) {
        var neg, val;

        if (!noAssert) {
            ok(typeof (isBigEndian) === 'boolean',
                'missing or invalid endian');

            ok(offset !== undefined && offset !== null,
                'missing offset');

            ok(offset + 1 < buffer.length,
                'Trying to read beyond buffer length');
        }

        val = readUInt16(buffer, offset, isBigEndian, noAssert);
        neg = val & 0x8000;
        if (!neg) {
            return val;
        }

        return (0xffff - val + 1) * -1;
    }

    proto.readInt16LE = function (offset, noAssert) {
        return readInt16(this, offset, false, noAssert);
    };

    proto.readInt16BE = function (offset, noAssert) {
        return readInt16(this, offset, true, noAssert);
    };

    function readInt32(buffer, offset, isBigEndian, noAssert) {
        var neg, val;

        if (!noAssert) {
            ok(typeof (isBigEndian) === 'boolean',
                'missing or invalid endian');

            ok(offset !== undefined && offset !== null,
                'missing offset');

            ok(offset + 3 < buffer.length,
                'Trying to read beyond buffer length');
        }

        val = readUInt32(buffer, offset, isBigEndian, noAssert);
        neg = val & 0x80000000;
        if (!neg) {
            return (val);
        }

        return (0xffffffff - val + 1) * -1;
    }

    proto.readInt32LE = function (offset, noAssert) {
        return readInt32(this, offset, false, noAssert);
    };

    proto.readInt32BE = function (offset, noAssert) {
        return readInt32(this, offset, true, noAssert);
    };

    function readIEEE754(buffer, offset, isBE, mLen, nBytes) {
        var e, m,
            eLen = nBytes * 8 - mLen - 1,
            eMax = (1 << eLen) - 1,
            eBias = eMax >> 1,
            nBits = -7,
            i = isBE ? 0 : (nBytes - 1),
            d = isBE ? 1 : -1,
            s = buffer[offset + i];

        i += d;

        e = s & ((1 << (-nBits)) - 1);
        s >>= (-nBits);
        nBits += eLen;
        for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

        m = e & ((1 << (-nBits)) - 1);
        e >>= (-nBits);
        nBits += mLen;
        for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

        if (e === 0) {
            e = 1 - eBias;
        } else if (e === eMax) {
            return m ? NaN : ((s ? -1 : 1) * Infinity);
        } else {
            m = m + Math.pow(2, mLen);
            e = e - eBias;
        }
        return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
    };

    function readFloat(buffer, offset, isBigEndian, noAssert) {
        if (!noAssert) {
            ok(typeof (isBigEndian) === 'boolean',
                'missing or invalid endian');

            ok(offset + 3 < buffer.length,
                'Trying to read beyond buffer length');
        }

        return readIEEE754(buffer, offset, isBigEndian,
            23, 4);
    }

    proto.readFloatLE = function (offset, noAssert) {
        return readFloat(this, offset, false, noAssert);
    };

    proto.readFloatBE = function (offset, noAssert) {
        return readFloat(this, offset, true, noAssert);
    };

    function readDouble(buffer, offset, isBigEndian, noAssert) {
        if (!noAssert) {
            ok(typeof (isBigEndian) === 'boolean',
                'missing or invalid endian');

            ok(offset + 7 < buffer.length,
                'Trying to read beyond buffer length');
        }

        return readIEEE754(buffer, offset, isBigEndian,
            52, 8);
    }

    proto.readDoubleLE = function (offset, noAssert) {
        return readDouble(this, offset, false, noAssert);
    };

    proto.readDoubleBE = function (offset, noAssert) {
        return readDouble(this, offset, true, noAssert);
    };


    function verifuint(value, max) {
        ok(typeof (value) == 'number',
            'cannot write a non-number as a number');

        ok(value >= 0,
            'specified a negative value for writing an unsigned value');

        ok(value <= max, 'value is larger than maximum value for type');

        ok(Math.floor(value) === value, 'value has a fractional component');
    }

    proto.writeUInt8 = function (value, offset, noAssert) {
        var buffer = this;

        if (!noAssert) {
            ok(value !== undefined && value !== null,
                'missing value');

            ok(offset !== undefined && offset !== null,
                'missing offset');

            ok(offset < buffer.length,
                'trying to write beyond buffer length');

            verifuint(value, 0xff);
        }

        buffer[offset] = value;
    };

    function writeUInt16(buffer, value, offset, isBigEndian, noAssert) {
        if (!noAssert) {
            ok(value !== undefined && value !== null,
                'missing value');

            ok(typeof (isBigEndian) === 'boolean',
                'missing or invalid endian');

            ok(offset !== undefined && offset !== null,
                'missing offset');

            ok(offset + 1 < buffer.length,
                'trying to write beyond buffer length');

            verifuint(value, 0xffff);
        }

        if (isBigEndian) {
            buffer[offset] = (value & 0xff00) >>> 8;
            buffer[offset + 1] = value & 0x00ff;
        } else {
            buffer[offset + 1] = (value & 0xff00) >>> 8;
            buffer[offset] = value & 0x00ff;
        }
    }

    proto.writeUInt16LE = function (value, offset, noAssert) {
        writeUInt16(this, value, offset, false, noAssert);
    };

    proto.writeUInt16BE = function (value, offset, noAssert) {
        writeUInt16(this, value, offset, true, noAssert);
    };

    function writeUInt32(buffer, value, offset, isBigEndian, noAssert) {
        if (!noAssert) {
            ok(value !== undefined && value !== null,
                'missing value');

            ok(typeof (isBigEndian) === 'boolean',
                'missing or invalid endian');

            ok(offset !== undefined && offset !== null,
                'missing offset');

            ok(offset + 3 < buffer.length,
                'trying to write beyond buffer length');

            verifuint(value, 0xffffffff);
        }

        if (isBigEndian) {
            buffer[offset] = (value >>> 24) & 0xff;
            buffer[offset + 1] = (value >>> 16) & 0xff;
            buffer[offset + 2] = (value >>> 8) & 0xff;
            buffer[offset + 3] = value & 0xff;
        } else {
            buffer[offset + 3] = (value >>> 24) & 0xff;
            buffer[offset + 2] = (value >>> 16) & 0xff;
            buffer[offset + 1] = (value >>> 8) & 0xff;
            buffer[offset] = value & 0xff;
        }
    }

    proto.writeUInt32LE = function (value, offset, noAssert) {
        writeUInt32(this, value, offset, false, noAssert);
    };

    proto.writeUInt32BE = function (value, offset, noAssert) {
        writeUInt32(this, value, offset, true, noAssert);
    };


    /*
     * We now move onto our friends in the signed number category. Unlike unsigned
     * numbers, we're going to have to worry a bit more about how we put values into
     * arrays. Since we are only worrying about signed 32-bit values, we're in
     * slightly better shape. Unfortunately, we really can't do our favorite binary
     * & in this system. It really seems to do the wrong thing. For example:
     *
     * > -32 & 0xff
     * 224
     *
     * What's happening above is really: 0xe0 & 0xff = 0xe0. However, the results of
     * this aren't treated as a signed number. Ultimately a bad thing.
     *
     * What we're going to want to do is basically create the unsigned equivalent of
     * our representation and pass that off to the wuint* functions. To do that
     * we're going to do the following:
     *
     *  - if the value is positive
     *      we can pass it directly off to the equivalent wuint
     *  - if the value is negative
     *      we do the following computation:
     *         mb + val + 1, where
     *         mb   is the maximum unsigned value in that byte size
     *         val  is the Javascript negative integer
     *
     *
     * As a concrete value, take -128. In signed 16 bits this would be 0xff80. If
     * you do out the computations:
     *
     * 0xffff - 128 + 1
     * 0xffff - 127
     * 0xff80
     *
     * You can then encode this value as the signed version. This is really rather
     * hacky, but it should work and get the job done which is our goal here.
     */

    /*
     * A series of checks to make sure we actually have a signed 32-bit number
     */
    function verifsint(value, max, min) {
        ok(typeof (value) == 'number',
            'cannot write a non-number as a number');

        ok(value <= max, 'value larger than maximum allowed value');

        ok(value >= min, 'value smaller than minimum allowed value');

        ok(Math.floor(value) === value, 'value has a fractional component');
    }

    function verifIEEE754(value, max, min) {
        ok(typeof (value) == 'number',
            'cannot write a non-number as a number');

        ok(value <= max, 'value larger than maximum allowed value');

        ok(value >= min, 'value smaller than minimum allowed value');
    }

    proto.writeInt8 = function (value, offset, noAssert) {
        var buffer = this;

        if (!noAssert) {
            ok(value !== undefined && value !== null,
                'missing value');

            ok(offset !== undefined && offset !== null,
                'missing offset');

            ok(offset < buffer.length,
                'Trying to write beyond buffer length');

            verifsint(value, 0x7f, -0x80);
        }

        if (value >= 0) {
            buffer.writeUInt8(value, offset, noAssert);
        } else {
            buffer.writeUInt8(0xff + value + 1, offset, noAssert);
        }
    };

    function writeInt16(buffer, value, offset, isBigEndian, noAssert) {
        if (!noAssert) {
            ok(value !== undefined && value !== null,
                'missing value');

            ok(typeof (isBigEndian) === 'boolean',
                'missing or invalid endian');

            ok(offset !== undefined && offset !== null,
                'missing offset');

            ok(offset + 1 < buffer.length,
                'Trying to write beyond buffer length');

            verifsint(value, 0x7fff, -0x8000);
        }

        if (value >= 0) {
            writeUInt16(buffer, value, offset, isBigEndian, noAssert);
        } else {
            writeUInt16(buffer, 0xffff + value + 1, offset, isBigEndian, noAssert);
        }
    }

    proto.writeInt16LE = function (value, offset, noAssert) {
        writeInt16(this, value, offset, false, noAssert);
    };

    proto.writeInt16BE = function (value, offset, noAssert) {
        writeInt16(this, value, offset, true, noAssert);
    };

    function writeInt32(buffer, value, offset, isBigEndian, noAssert) {
        if (!noAssert) {
            ok(value !== undefined && value !== null,
                'missing value');

            ok(typeof (isBigEndian) === 'boolean',
                'missing or invalid endian');

            ok(offset !== undefined && offset !== null,
                'missing offset');

            ok(offset + 3 < buffer.length,
                'Trying to write beyond buffer length');

            verifsint(value, 0x7fffffff, -0x80000000);
        }

        if (value >= 0) {
            writeUInt32(buffer, value, offset, isBigEndian, noAssert);
        } else {
            writeUInt32(buffer, 0xffffffff + value + 1, offset, isBigEndian, noAssert);
        }
    }

    proto.writeInt32LE = function (value, offset, noAssert) {
        writeInt32(this, value, offset, false, noAssert);
    };

    proto.writeInt32BE = function (value, offset, noAssert) {
        writeInt32(this, value, offset, true, noAssert);
    };

    function writeIEEE754(buffer, value, offset, isBE, mLen, nBytes) {
        var e, m, c,
            eLen = nBytes * 8 - mLen - 1,
            eMax = (1 << eLen) - 1,
            eBias = eMax >> 1,
            rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
            i = isBE ? (nBytes - 1) : 0,
            d = isBE ? -1 : 1,
            s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

        value = Math.abs(value);

        if (isNaN(value) || value === Infinity) {
            m = isNaN(value) ? 1 : 0;
            e = eMax;
        } else {
            e = Math.floor(Math.log(value) / Math.LN2);
            if (value * (c = Math.pow(2, -e)) < 1) {
                e--;
                c *= 2;
            }
            if (e + eBias >= 1) {
                value += rt / c;
            } else {
                value += rt * Math.pow(2, 1 - eBias);
            }
            if (value * c >= 2) {
                e++;
                c /= 2;
            }

            if (e + eBias >= eMax) {
                m = 0;
                e = eMax;
            } else if (e + eBias >= 1) {
                m = (value * c - 1) * Math.pow(2, mLen);
                e = e + eBias;
            } else {
                m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
                e = 0;
            }
        }

        for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

        e = (e << mLen) | m;
        eLen += mLen;
        for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

        buffer[offset + i - d] |= s * 128;
    };

    function writeFloat(buffer, value, offset, isBigEndian, noAssert) {
        if (!noAssert) {
            ok(value !== undefined && value !== null,
                'missing value');

            ok(typeof (isBigEndian) === 'boolean',
                'missing or invalid endian');

            ok(offset !== undefined && offset !== null,
                'missing offset');

            ok(offset + 3 < buffer.length,
                'Trying to write beyond buffer length');

            verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38);
        }

        writeIEEE754(buffer, value, offset, isBigEndian,
            23, 4);
    }

    proto.writeFloatLE = function (value, offset, noAssert) {
        writeFloat(this, value, offset, false, noAssert);
    };

    proto.writeFloatBE = function (value, offset, noAssert) {
        writeFloat(this, value, offset, true, noAssert);
    };

    function writeDouble(buffer, value, offset, isBigEndian, noAssert) {
        if (!noAssert) {
            ok(value !== undefined && value !== null,
                'missing value');

            ok(typeof (isBigEndian) === 'boolean',
                'missing or invalid endian');

            ok(offset !== undefined && offset !== null,
                'missing offset');

            ok(offset + 7 < buffer.length,
                'Trying to write beyond buffer length');

            verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308);
        }

        writeIEEE754(buffer, value, offset, isBigEndian,
            52, 8);
    }

    proto.writeDoubleLE = function (value, offset, noAssert) {
        writeDouble(this, value, offset, false, noAssert);
    };

    proto.writeDoubleBE = function (value, offset, noAssert) {
        writeDouble(this, value, offset, true, noAssert);
    };


    var pool;

    Buffer.poolSize = 8 * 1024;

    function allocPool() {
        pool = new ArrayBuffer(Buffer.poolSize);
        pool.used = 0;
    }

    Buffer.isBuffer = function isBuffer(b) {
        return b instanceof Buffer || b instanceof ArrayBuffer;
    };

    Buffer.byteLength = function (string, encoding) {
        switch (encoding) {
            case "ascii":
                return string.length;
        }
        for (var i = 0, l = 0, le = string.length, c; i < le; i++) {
            c = string.charCodeAt(i);
            if (c < 128) {
                l++;
            } else if ((c > 127) && (c < 2048)) {
                l += 2;
            } else {
                l += 3;
            }
        }
        return l;
    }

    window.Buffer = Buffer;
})();
