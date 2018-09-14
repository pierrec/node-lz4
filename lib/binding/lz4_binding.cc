#include <string.h>
#include <stdlib.h>

#include <node.h>
#include <node_buffer.h>
#include <nan.h>

#include "xxhash_binding.h"
#include "../../deps/lz4/lib/lz4.h"
#include "../../deps/lz4/lib/lz4hc.h"

using namespace node;
using namespace v8;

//-----------------------------------------------------------------------------
// LZ4 Compress
//-----------------------------------------------------------------------------
// Simple functions

// {Buffer} input, {Buffer} output
NAN_METHOD(LZ4Compress) {
  Nan::HandleScope scope;

  uint32_t alen = info.Length();
  if (alen < 2 && alen > 4) {
    Nan::ThrowError("Wrong number of arguments");
    return;
  }

  if (!Buffer::HasInstance(info[0]) || !Buffer::HasInstance(info[1])) {
    Nan::ThrowTypeError("Wrong arguments");
    return;
  }
  Local<Object> input = info[0]->ToObject();
  Local<Object> output = info[1]->ToObject();

  Local<Integer> result;
  uint32_t sIdx = 0;
  uint32_t eIdx = Buffer::Length(output);
  switch (alen) {
  case 4:
    if (!info[3]->IsUint32()) {
      Nan::ThrowTypeError("Invalid endIdx");
      return;
    }
    if (!info[2]->IsUint32()) {
      Nan::ThrowTypeError("Invalid startIdx");
      return;
    }
    sIdx = info[2]->Uint32Value();
    eIdx = info[3]->Uint32Value();
    result = Nan::New<Integer>(LZ4_compress_limitedOutput(Buffer::Data(input),
                                                        Buffer::Data(output) + sIdx,
                                                        Buffer::Length(input),
                                                        eIdx - sIdx)
                            );
    break;
  case 3:
    if (!info[2]->IsUint32()) {
      Nan::ThrowTypeError("Invalid startIdx");
      return;
    }
    sIdx = info[2]->Uint32Value();
  case 2:
    result = Nan::New<Integer>(LZ4_compress(Buffer::Data(input),
                                          Buffer::Data(output) + sIdx,
                                          Buffer::Length(input))
                            );
  }

  info.GetReturnValue().Set(result);
}

// {Buffer} input, {Buffer} output
NAN_METHOD(LZ4CompressHC) {
  Nan::HandleScope scope;

  if (info.Length() != 2) {
    Nan::ThrowError("Wrong number of arguments");
    return;
  }

  if (!Buffer::HasInstance(info[0]) || !Buffer::HasInstance(info[1])) {
    Nan::ThrowTypeError("Wrong arguments");
    return;
  }

  Local<Object> input = info[0]->ToObject();
  Local<Object> output = info[1]->ToObject();

  Local<Integer> result = Nan::New<Integer>(LZ4_compressHC(Buffer::Data(input),
                                                         Buffer::Data(output),
                                                         Buffer::Length(input))
                                         );
  info.GetReturnValue().Set(result);
}

// Advanced functions

// {Integer} Buffer size
NAN_METHOD(LZ4CompressBound) {
  Nan::HandleScope scope;

  if (info.Length() != 1) {
    Nan::ThrowError("Wrong number of arguments");
    return;
  }

  if (!info[0]->IsUint32()) {
    Nan::ThrowTypeError("Wrong arguments");
    return;
  }

  uint32_t size = info[0]->Uint32Value();

  info.GetReturnValue().Set(
    Nan::New<Integer>(LZ4_compressBound(size))
  );
}

// {Buffer} input, {Buffer} output, {Integer} maxOutputSize
NAN_METHOD(LZ4CompressLimited) {
  Nan::HandleScope scope;

  if (info.Length() != 3) {
    Nan::ThrowError("Wrong number of arguments");
    return;
  }

  if (!Buffer::HasInstance(info[0]) || !Buffer::HasInstance(info[1])) {
    Nan::ThrowTypeError("Wrong arguments");
    return;
  }

  if (!info[2]->IsUint32()) {
    Nan::ThrowTypeError("Wrong arguments");
    return;
  }

  Local<Object> input = info[0]->ToObject();
  Local<Object> output = info[1]->ToObject();
  uint32_t size = info[2]->Uint32Value();

  Local<Integer> result = Nan::New<Integer>(LZ4_compress_limitedOutput(Buffer::Data(input),
                                                                     Buffer::Data(output),
                                                                     Buffer::Length(input),
                                                                     size)
                                         );
  info.GetReturnValue().Set(result);
}

// {Buffer} input, {Buffer} output, {Integer} maxOutputSize
NAN_METHOD(LZ4CompressHCLimited) {
  Nan::HandleScope scope;

  if (info.Length() != 3) {
    Nan::ThrowError("Wrong number of arguments");
    return;
  }

  if (!Buffer::HasInstance(info[0]) || !Buffer::HasInstance(info[1])) {
    Nan::ThrowTypeError("Wrong arguments");
    return;
  }

  if (!info[2]->IsUint32()) {
    Nan::ThrowTypeError("Wrong arguments");
    return;
  }

  Local<Object> input = info[0]->ToObject();
  Local<Object> output = info[1]->ToObject();
  uint32_t size = info[2]->Uint32Value();

  Local<Integer> result = Nan::New<Integer>(LZ4_compressHC_limitedOutput(Buffer::Data(input),
                                                                       Buffer::Data(output),
                                                                       Buffer::Length(input),
                                                                       size)
                                         );
  info.GetReturnValue().Set(result);
}

void null_cb(char* data, void* hint) {
  
}
/*
//-----------------------------------------------------------------------------
// LZ4 Stream
//-----------------------------------------------------------------------------
// {Buffer} input
NAN_METHOD(LZ4Stream_create) {
  Nan::HandleScope scope;

  if (info.Length() != 1) {
    Nan::ThrowError("Wrong number of arguments");
    return;
  }

  if (!Buffer::HasInstance(info[0])) {
    Nan::ThrowTypeError("Wrong arguments");
    return;
  }

  Local<Object> input = info[0]->ToObject();

  void* p = LZ4_create( Buffer::Data(input) );

  if (p == NULL) {
    return;
  }

  Nan::MaybeLocal<Object> handle = Nan::NewBuffer((char *)p, LZ4_sizeofStreamState(), null_cb, NULL);

  info.GetReturnValue().Set(handle.ToLocalChecked());
}

// {Buffer} lz4 data struct, {Buffer} input, {Buffer} output
NAN_METHOD(LZ4Stream_compress_continue) {
  Nan::HandleScope scope;

  if (info.Length() != 3) {
    Nan::ThrowError("Wrong number of arguments");
    return;
  }

  if (!Buffer::HasInstance(info[0]) || !Buffer::HasInstance(info[1]) || !Buffer::HasInstance(info[2])) {
    Nan::ThrowTypeError("Wrong arguments");
    return;
  }

  Local<Object> lz4ds = info[0]->ToObject();
  Local<Object> input = info[1]->ToObject();
  Local<Object> output = info[2]->ToObject();

  Local<Integer> result = Nan::New<Integer>(LZ4_compress_continue(
                                            (LZ4_stream_t*)Buffer::Data(lz4ds),
                                            Buffer::Data(input),
                                            Buffer::Data(output),
                                            Buffer::Length(input))
                                         );
  info.GetReturnValue().Set(result);
}

// {Buffer} input, {Buffer} lz4 data struct
NAN_METHOD(LZ4Stream_slideInputBuffer) {
  Nan::HandleScope scope;

  if (info.Length() != 2) {
    Nan::ThrowError("Wrong number of arguments");
    return;
  }

  if (!Buffer::HasInstance(info[0]) || !Buffer::HasInstance(info[1])) {
    Nan::ThrowTypeError("Wrong arguments");
    return;
  }

  Local<Object> lz4ds = info[0]->ToObject();
  Local<Object> input = info[1]->ToObject();

  // Pointer to the position into the input buffer where the next data block should go
  char* input_next_block = LZ4_slideInputBuffer(Buffer::Data(lz4ds));
  char* input_current = (char *)Buffer::Data(input);

  // Return the position of the next block
  info.GetReturnValue().Set(Nan::New<Integer>((int)(input_next_block - input_current)));
}

// {Buffer} lz4 data struct
NAN_METHOD(LZ4Stream_free) {
  Nan::HandleScope scope;

  if (info.Length() != 1) {
    Nan::ThrowError("Wrong number of arguments");
    return;
  }

  if (!Buffer::HasInstance(info[0])) {
    Nan::ThrowTypeError("Wrong arguments");
    return;
  }

  Local<Object> lz4ds = info[0]->ToObject();
  int res = LZ4_freeStream( (LZ4_stream_t*) Buffer::Data(lz4ds) );

  info.GetReturnValue().Set(Nan::New<Integer>(res));
}
*/
//-----------------------------------------------------------------------------
// LZ4 Uncompress
//-----------------------------------------------------------------------------
// {Buffer} input, {Buffer} output
NAN_METHOD(LZ4Uncompress) {
  Nan::HandleScope scope;

  uint32_t alen = info.Length();
  if (alen < 2 && alen > 4) {
    Nan::ThrowError("Wrong number of arguments");
    return;
  }

  if (!Buffer::HasInstance(info[0]) || !Buffer::HasInstance(info[1])) {
    Nan::ThrowTypeError("Wrong arguments");
    return;
  }
  Local<Object> input = info[0]->ToObject();
  Local<Object> output = info[1]->ToObject();

  Local<Integer> result;
  uint32_t sIdx = 0;
  uint32_t eIdx = Buffer::Length(input);
  switch (alen) {
  case 4:
    if (!info[3]->IsUint32()) {
      Nan::ThrowTypeError("Invalid endIdx");
      return;
    }
    if (!info[2]->IsUint32()) {
      Nan::ThrowTypeError("Invalid startIdx");
      return;
    }
    sIdx = info[2]->Uint32Value();
    eIdx = info[3]->Uint32Value();
    result = Nan::New<Integer>(LZ4_decompress_safe(Buffer::Data(input) + sIdx,
                                                 Buffer::Data(output),
                                                 eIdx - sIdx,
                                                 Buffer::Length(output))
                            );
    break;
  case 3:
    if (!info[2]->IsInt32()) {
      Nan::ThrowTypeError("Invalid startIdx");
      return;
    }
    sIdx = info[2]->Uint32Value();
  case 2:
    result = Nan::New<Integer>(LZ4_decompress_safe(Buffer::Data(input) + sIdx,
                                                 Buffer::Data(output),
                                                 eIdx - sIdx,
                                                 Buffer::Length(output))
                            );
  }

  info.GetReturnValue().Set(result);
}

// {Buffer} input, {Buffer} output
NAN_METHOD(LZ4Uncompress_fast) {
  Nan::HandleScope scope;

  if (info.Length() != 2) {
    Nan::ThrowError("Wrong number of arguments");
    return;
  }

  if (!Buffer::HasInstance(info[0]) || !Buffer::HasInstance(info[1])) {
    Nan::ThrowTypeError("Wrong arguments");
    return;
  }

  Local<Object> input = info[0]->ToObject();
  Local<Object> output = info[1]->ToObject();

  Local<Integer> result = Nan::New<Integer>(LZ4_decompress_fast(Buffer::Data(input),
                                                              Buffer::Data(output),
                                                              Buffer::Length(output))
                                         );
  info.GetReturnValue().Set(result);
}

NAN_MODULE_INIT(init_lz4) {
  Nan::Export(target, "compressBound", LZ4CompressBound);
  Nan::Export(target, "compress", LZ4Compress);
  Nan::Export(target, "compressLimited", LZ4CompressLimited);

  // Nan::Export(target, "lz4s_create", LZ4Stream_create);
  // Nan::Export(target, "lz4s_compress_continue", LZ4Stream_compress_continue);
  // Nan::Export(target, "lz4s_slide_input", LZ4Stream_slideInputBuffer);
  // Nan::Export(target, "lz4s_free", LZ4Stream_free);

  Nan::Export(target, "compressHC", LZ4CompressHC);
  Nan::Export(target, "compressHCLimited", LZ4CompressHCLimited);

  Nan::Export(target, "uncompress", LZ4Uncompress);
  Nan::Export(target, "uncompress_fast", LZ4Uncompress_fast);

  Nan::Export(target, "xxHash", xxHash);
  Nan::Export(target, "init", xxHash_init);
  Nan::Export(target, "update", xxHash_update);
  Nan::Export(target, "digest", xxHash_digest);
}

NODE_MODULE(lz4, init_lz4)
