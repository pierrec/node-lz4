#include <string.h>
#include <stdlib.h>

#include <node.h>
#include <node_buffer.h>

#include "../deps/lz4/lz4.h"
#include "../deps/lz4/lz4hc.h"
#include "../deps/lz4/xxhash.h"

using namespace node;
using namespace v8;

//-----------------------------------------------------------------------------
// xxHash
//-----------------------------------------------------------------------------
// {Buffer} input, {Integer} seed (optional)
Handle<Value> xxHash (const Arguments& args) {
  HandleScope scope;

  if (args.Length() == 0) {
    ThrowException(Exception::Error(String::New("Wrong number of arguments")));
    return scope.Close(Undefined());
  }

  if (!Buffer::HasInstance(args[0])) {
    ThrowException(Exception::TypeError(String::New("Wrong argument: Buffer expected")));
    return scope.Close(Undefined());
  }

  Local<Object> input = args[0]->ToObject();
  uint32_t seed = 0;
  if (args[1]->IsUint32()) {
    seed = args[1]->Uint32Value();
  }

  Local<Integer> result = Integer::NewFromUnsigned(XXH32(Buffer::Data(input)
                                                , Buffer::Length(input)
                                                , seed
                                                ));
  return scope.Close(result->ToUint32());
}

// {Integer} seed
Handle<Value> xxHash_init (const Arguments& args) {
  HandleScope scope;

  if (args.Length() == 0) {
    ThrowException(Exception::Error(String::New("Wrong number of arguments")));
    return scope.Close(Undefined());
  }

  if (!args[0]->IsUint32()) {
    ThrowException(Exception::TypeError(String::New("Wrong argument: Integer expected")));
    return scope.Close(Undefined());
  }

  uint32_t seed = args[0]->Uint32Value();
  int size = XXH32_sizeofState();

  Buffer *buf = Buffer::New(size);
  memcpy( Buffer::Data(buf), XXH32_init(seed), size );

  return scope.Close(buf->handle_);
}

// {Buffer} state {Buffer} input {Integer} seed
Handle<Value> xxHash_update (const Arguments& args) {
  HandleScope scope;

  if (args.Length() != 2) {
    ThrowException(Exception::Error(String::New("Wrong number of arguments")));
    return scope.Close(Undefined());
  }

  if (!Buffer::HasInstance(args[0]) || !Buffer::HasInstance(args[1])) {
    ThrowException(Exception::TypeError(String::New("Wrong arguments")));
    return scope.Close(Undefined());
  }

  int err_code = XXH32_update(
    Buffer::Data(args[0])
  , Buffer::Data(args[1])
  , Buffer::Length(args[1])
  );

  return scope.Close( Integer::NewFromUnsigned(err_code)->ToUint32() );
}

// {Buffer} state
Handle<Value> xxHash_digest (const Arguments& args) {
  HandleScope scope;

  if (args.Length() != 1) {
    ThrowException(Exception::Error(String::New("Wrong number of arguments")));
    return scope.Close(Undefined());
  }

  if (!Buffer::HasInstance(args[0])) {
    ThrowException(Exception::TypeError(String::New("Wrong arguments")));
    return scope.Close(Undefined());
  }

  Local<Integer> res = Integer::NewFromUnsigned(
    XXH32_digest( Buffer::Data(args[0]) )
  );

  return scope.Close(res->ToUint32());
}

//-----------------------------------------------------------------------------
// LZ4 Compress
//-----------------------------------------------------------------------------
// Simple functions

// {Buffer} input, {Buffer} output
Handle<Value> LZ4Compress(const Arguments& args) {
  HandleScope scope;

  if (args.Length() != 2) {
    ThrowException(Exception::Error(String::New("Wrong number of arguments")));
    return scope.Close(Undefined());
  }

  if (!Buffer::HasInstance(args[0]) || !Buffer::HasInstance(args[1])) {
    ThrowException(Exception::TypeError(String::New("Wrong arguments")));
    return scope.Close(Undefined());
  }

  Local<Object> input = args[0]->ToObject();
  Local<Object> output = args[1]->ToObject();

  Local<Integer> result = Integer::NewFromUnsigned(LZ4_compress(Buffer::Data(input),
                                                            Buffer::Data(output),
                                                            Buffer::Length(input))
                                                );
  return scope.Close(result->ToUint32());
}

// {Buffer} input, {Buffer} output
Handle<Value> LZ4CompressHC(const Arguments& args) {
  HandleScope scope;

  if (args.Length() != 2) {
    ThrowException(Exception::Error(String::New("Wrong number of arguments")));
    return scope.Close(Undefined());
  }

  if (!Buffer::HasInstance(args[0]) || !Buffer::HasInstance(args[1])) {
    ThrowException(Exception::TypeError(String::New("Wrong arguments")));
    return scope.Close(Undefined());
  }

  Local<Object> input = args[0]->ToObject();
  Local<Object> output = args[1]->ToObject();

  Local<Integer> result = Integer::NewFromUnsigned(LZ4_compressHC(Buffer::Data(input),
                                                            Buffer::Data(output),
                                                            Buffer::Length(input))
                                                );
  return scope.Close(result->ToUint32());
}

// Advanced functions

// {Integer} Buffer size
Handle<Value> LZ4CompressBound(const Arguments& args) {
  HandleScope scope;

  if (args.Length() != 1) {
    ThrowException(Exception::Error(String::New("Wrong number of arguments")));
    return scope.Close(Undefined());
  }

  if (!args[0]->IsUint32()) {
    ThrowException(Exception::TypeError(String::New("Wrong arguments")));
    return scope.Close(Undefined());
  }

  uint32_t size = args[0]->Uint32Value();

  Local<Integer> result = Integer::NewFromUnsigned(LZ4_compressBound(size));
  return scope.Close(result->ToUint32());
}

// {Buffer} input, {Buffer} output, {Integer} maxOutputSize
Handle<Value> LZ4CompressLimited(const Arguments& args) {
  HandleScope scope;

  if (args.Length() != 3) {
    ThrowException(Exception::Error(String::New("Wrong number of arguments")));
    return scope.Close(Undefined());
  }

  if (!Buffer::HasInstance(args[0]) || !Buffer::HasInstance(args[1])) {
    ThrowException(Exception::TypeError(String::New("Wrong arguments")));
    return scope.Close(Undefined());
  }

  if (!args[2]->IsUint32()) {
    ThrowException(Exception::TypeError(String::New("Wrong arguments")));
    return scope.Close(Undefined());
  }

  Local<Object> input = args[0]->ToObject();
  Local<Object> output = args[1]->ToObject();
  uint32_t size = args[2]->Uint32Value();

  Local<Integer> result = Integer::NewFromUnsigned(LZ4_compress_limitedOutput(Buffer::Data(input),
                                                            Buffer::Data(output),
                                                            Buffer::Length(input),
                                                            size)
                                                );
  return scope.Close(result->ToUint32());
}

// {Buffer} input, {Buffer} output, {Integer} maxOutputSize
Handle<Value> LZ4CompressHCLimited(const Arguments& args) {
  HandleScope scope;

  if (args.Length() != 3) {
    ThrowException(Exception::Error(String::New("Wrong number of arguments")));
    return scope.Close(Undefined());
  }

  if (!Buffer::HasInstance(args[0]) || !Buffer::HasInstance(args[1])) {
    ThrowException(Exception::TypeError(String::New("Wrong arguments")));
    return scope.Close(Undefined());
  }

  if (!args[2]->IsUint32()) {
    ThrowException(Exception::TypeError(String::New("Wrong arguments")));
    return scope.Close(Undefined());
  }

  Local<Object> input = args[0]->ToObject();
  Local<Object> output = args[1]->ToObject();
  uint32_t size = args[2]->Uint32Value();

  Local<Integer> result = Integer::NewFromUnsigned(LZ4_compressHC_limitedOutput(Buffer::Data(input),
                                                            Buffer::Data(output),
                                                            Buffer::Length(input),
                                                            size)
                                                );
  return scope.Close(result->ToUint32());
}

//-----------------------------------------------------------------------------
// LZ4 Uncompress
//-----------------------------------------------------------------------------
// {Buffer} input, {Buffer} output
Handle<Value> LZ4Uncompress(const Arguments& args) {
  HandleScope scope;

  if (args.Length() != 2) {
    ThrowException(Exception::Error(String::New("Wrong number of arguments")));
    return scope.Close(Undefined());
  }

  if (!Buffer::HasInstance(args[0]) || !Buffer::HasInstance(args[1])) {
    ThrowException(Exception::TypeError(String::New("Wrong arguments")));
    return scope.Close(Undefined());
  }

  Local<Object> input = args[0]->ToObject();
  Local<Object> output = args[1]->ToObject();

  Local<Integer> result = Integer::NewFromUnsigned(LZ4_decompress_safe(Buffer::Data(input),
                                                            Buffer::Data(output),
                                                            Buffer::Length(input),
                                                            Buffer::Length(output))
                                                );
  return scope.Close(result->ToUint32());
}

// {Buffer} input, {Buffer} output
Handle<Value> LZ4Uncompress_unknownOutputSize(const Arguments& args) {
  HandleScope scope;

  if (args.Length() != 2) {
    ThrowException(Exception::Error(String::New("Wrong number of arguments")));
    return scope.Close(Undefined());
  }

  if (!Buffer::HasInstance(args[0]) || !Buffer::HasInstance(args[1])) {
    ThrowException(Exception::TypeError(String::New("Wrong arguments")));
    return scope.Close(Undefined());
  }

  Local<Object> input = args[0]->ToObject();
  Local<Object> output = args[1]->ToObject();

  Local<Integer> result = Integer::NewFromUnsigned(LZ4_uncompress_unknownOutputSize(Buffer::Data(input),
                                                            Buffer::Data(output),
                                                            Buffer::Length(input),
                                                            Buffer::Length(output))
                                                );
  return scope.Close(result->ToUint32());
}

void init_lz4(Handle<Object> target) {
  NODE_SET_METHOD(target, "compress", LZ4Compress);
  NODE_SET_METHOD(target, "compressLimited", LZ4CompressLimited);
  NODE_SET_METHOD(target, "compressHC", LZ4CompressHC);
  NODE_SET_METHOD(target, "compressHCLimited", LZ4CompressHCLimited);
  NODE_SET_METHOD(target, "compressBound", LZ4CompressBound);
  NODE_SET_METHOD(target, "uncompress", LZ4Uncompress);
  NODE_SET_METHOD(target, "uncompress_unknownOutputSize", LZ4Uncompress_unknownOutputSize);
  NODE_SET_METHOD(target, "xxHash", xxHash);
  NODE_SET_METHOD(target, "xxHash_init", xxHash_init);
  NODE_SET_METHOD(target, "xxHash_update", xxHash_update);
  NODE_SET_METHOD(target, "xxHash_digest", xxHash_digest);
}

NODE_MODULE(lz4, init_lz4)