#include <string.h>
#include <stdlib.h>

#include <node.h>
#include <node_buffer.h>

#include "../../deps/lz4/lz4.h"
#include "../../deps/lz4/lz4hc.h"

using namespace node;
using namespace v8;

//-----------------------------------------------------------------------------
// LZ4 Compress
//-----------------------------------------------------------------------------
// Simple functions

// {Buffer} input, {Buffer} output
Handle<Value> LZ4Compress(const Arguments& args) {
  HandleScope scope;

  uint32_t alen = args.Length();
  if (alen < 2 && alen > 4) {
    ThrowException(Exception::Error(String::New("Wrong number of arguments")));
    return scope.Close(Undefined());
  }

  if (!Buffer::HasInstance(args[0]) || !Buffer::HasInstance(args[1])) {
    ThrowException(Exception::TypeError(String::New("Wrong arguments")));
    return scope.Close(Undefined());
  }
  Local<Object> input = args[0]->ToObject();
  Local<Object> output = args[1]->ToObject();

  Local<Integer> result;
  uint32_t sIdx = 0;
  uint32_t eIdx = Buffer::Length(output);
  switch (alen) {
  case 4:
    if (!args[3]->IsUint32()) {
      ThrowException(Exception::TypeError(String::New("Invalid endIdx")));
      return scope.Close(Undefined());
    }
    if (!args[2]->IsUint32()) {
      ThrowException(Exception::TypeError(String::New("Invalid startIdx")));
      return scope.Close(Undefined());
    }
    sIdx = args[2]->Uint32Value();
    eIdx = args[3]->Uint32Value();
    result = Integer::NewFromUnsigned(LZ4_compress_limitedOutput(Buffer::Data(input),
                                                              Buffer::Data(output) + sIdx,
                                                              Buffer::Length(input),
                                                              eIdx - sIdx)
                                                  );
    break;
  case 3:
    if (!args[2]->IsUint32()) {
      ThrowException(Exception::TypeError(String::New("Invalid startIdx")));
      return scope.Close(Undefined());
    }
    sIdx = args[2]->Uint32Value();
  case 2:
    result = Integer::NewFromUnsigned(LZ4_compress(Buffer::Data(input),
                                                              Buffer::Data(output) + sIdx,
                                                              Buffer::Length(input))
                                                  );
  }

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
// LZ4 Stream
//-----------------------------------------------------------------------------
// {Buffer} input
Handle<Value> LZ4Stream_create(const Arguments& args) {
  HandleScope scope;

  if (args.Length() != 1) {
    ThrowException(Exception::Error(String::New("Wrong number of arguments")));
    return scope.Close(Undefined());
  }

  if (!Buffer::HasInstance(args[0])) {
    ThrowException(Exception::TypeError(String::New("Wrong arguments")));
    return scope.Close(Undefined());
  }

  Local<Object> input = args[0]->ToObject();

  void* p = LZ4_create( Buffer::Data(input) );

  if (p == NULL) {
    return scope.Close(Undefined());
  }

  Buffer *buf = Buffer::New( (char *)p, LZ4_sizeofStreamState() );

  return scope.Close(buf->handle_);
}

// {Buffer} lz4 data struct, {Buffer} input, {Buffer} output
Handle<Value> LZ4Stream_compress_continue(const Arguments& args) {
  HandleScope scope;

  if (args.Length() != 3) {
    ThrowException(Exception::Error(String::New("Wrong number of arguments")));
    return scope.Close(Undefined());
  }

  if (!Buffer::HasInstance(args[0]) || !Buffer::HasInstance(args[1]) || !Buffer::HasInstance(args[2])) {
    ThrowException(Exception::TypeError(String::New("Wrong arguments")));
    return scope.Close(Undefined());
  }

  Local<Object> lz4ds = args[0]->ToObject();
  Local<Object> input = args[1]->ToObject();
  Local<Object> output = args[2]->ToObject();

  Local<Integer> result = Integer::NewFromUnsigned(LZ4_compress_continue(
                                                            Buffer::Data(lz4ds),
                                                            Buffer::Data(input),
                                                            Buffer::Data(output),
                                                            Buffer::Length(input))
                                                );
  return scope.Close(result->ToUint32());
}

// {Buffer} input, {Buffer} lz4 data struct
Handle<Value> LZ4Stream_slideInputBuffer(const Arguments& args) {
  HandleScope scope;

  if (args.Length() != 2) {
    ThrowException(Exception::Error(String::New("Wrong number of arguments")));
    return scope.Close(Undefined());
  }

  if (!Buffer::HasInstance(args[0]) || !Buffer::HasInstance(args[1])) {
    ThrowException(Exception::TypeError(String::New("Wrong arguments")));
    return scope.Close(Undefined());
  }

  Local<Object> lz4ds = args[0]->ToObject();
  Local<Object> input = args[1]->ToObject();

  // Pointer to the position into the input buffer where the next data block should go
  char* input_next_block = LZ4_slideInputBuffer( Buffer::Data(lz4ds) );
  char* input_current = (char *)Buffer::Data(input);

  // Return the position of the next block
  return scope.Close( Integer::NewFromUnsigned((int)(input_next_block - input_current)) );
}

// {Buffer} lz4 data struct
Handle<Value> LZ4Stream_free(const Arguments& args) {
  HandleScope scope;

  if (args.Length() != 1) {
    ThrowException(Exception::Error(String::New("Wrong number of arguments")));
    return scope.Close(Undefined());
  }

  if (!Buffer::HasInstance(args[0])) {
    ThrowException(Exception::TypeError(String::New("Wrong arguments")));
    return scope.Close(Undefined());
  }

  Local<Object> lz4ds = args[0]->ToObject();
  int res = LZ4_free( Buffer::Data(lz4ds) );

  return scope.Close( Integer::New(res) );
}

//-----------------------------------------------------------------------------
// LZ4 Uncompress
//-----------------------------------------------------------------------------
// {Buffer} input, {Buffer} output
Handle<Value> LZ4Uncompress(const Arguments& args) {
  HandleScope scope;

  uint32_t alen = args.Length();
  if (alen < 2 && alen > 4) {
    ThrowException(Exception::Error(String::New("Wrong number of arguments")));
    return scope.Close(Undefined());
  }

  if (!Buffer::HasInstance(args[0]) || !Buffer::HasInstance(args[1])) {
    ThrowException(Exception::TypeError(String::New("Wrong arguments")));
    return scope.Close(Undefined());
  }
  Local<Object> input = args[0]->ToObject();
  Local<Object> output = args[1]->ToObject();

  Local<Integer> result;
  uint32_t sIdx = 0;
  uint32_t eIdx = Buffer::Length(input);
  switch (alen) {
  case 4:
    if (!args[3]->IsUint32()) {
      ThrowException(Exception::TypeError(String::New("Invalid endIdx")));
      return scope.Close(Undefined());
    }
    if (!args[2]->IsUint32()) {
      ThrowException(Exception::TypeError(String::New("Invalid startIdx")));
      return scope.Close(Undefined());
    }
    sIdx = args[2]->Uint32Value();
    eIdx = args[3]->Uint32Value();
    result = Integer::NewFromUnsigned(LZ4_decompress_safe(Buffer::Data(input) + sIdx,
                                                            Buffer::Data(output),
                                                            eIdx - sIdx,
                                                            Buffer::Length(output))
                                                );
    break;
  case 3:
    if (!args[2]->IsInt32()) {
      ThrowException(Exception::TypeError(String::New("Invalid startIdx")));
      return scope.Close(Undefined());
    }
    sIdx = args[2]->Uint32Value();
  case 2:
    result = Integer::NewFromUnsigned(LZ4_decompress_safe(Buffer::Data(input) + sIdx,
                                                            Buffer::Data(output),
                                                            eIdx - sIdx,
                                                            Buffer::Length(output))
                                                );
  }

  return scope.Close(result->ToUint32());
}

// {Buffer} input, {Buffer} output
Handle<Value> LZ4Uncompress_fast(const Arguments& args) {
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

  Local<Integer> result = Integer::NewFromUnsigned(LZ4_decompress_fast(Buffer::Data(input),
                                                            Buffer::Data(output),
                                                            Buffer::Length(output))
                                                );
  return scope.Close(result->ToUint32());
}

void init_lz4(Handle<Object> target) {
  NODE_SET_METHOD(target, "compressBound", LZ4CompressBound);
  NODE_SET_METHOD(target, "compress", LZ4Compress);
  NODE_SET_METHOD(target, "compressLimited", LZ4CompressLimited);
  NODE_SET_METHOD(target, "lz4s_create", LZ4Stream_create);
  NODE_SET_METHOD(target, "lz4s_compress_continue", LZ4Stream_compress_continue);
  NODE_SET_METHOD(target, "lz4s_slide_input", LZ4Stream_slideInputBuffer);
  NODE_SET_METHOD(target, "lz4s_free", LZ4Stream_free);

  NODE_SET_METHOD(target, "compressHC", LZ4CompressHC);
  NODE_SET_METHOD(target, "compressHCLimited", LZ4CompressHCLimited);

  NODE_SET_METHOD(target, "uncompress", LZ4Uncompress);
  NODE_SET_METHOD(target, "uncompress_fast", LZ4Uncompress_fast);
}

NODE_MODULE(lz4, init_lz4)