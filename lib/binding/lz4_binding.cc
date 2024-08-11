#define NAPI_VERSION 3
#include <napi.h>

#include "../../deps/lz4/lib/lz4.h"
#include "../../deps/lz4/lib/lz4hc.h"

//-----------------------------------------------------------------------------
// LZ4 Compress
//-----------------------------------------------------------------------------
// Simple functions

// {Buffer} input, {Buffer} output
Napi::Value LZ4Compress(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  uint32_t alen = info.Length();
  if (alen < 2 || alen > 4) {
    Napi::Error::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[0].IsBuffer() || !info[1].IsBuffer()) {
    Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
    return env.Null();
  }
  Napi::Buffer<char> input = info[0].As<Napi::Buffer<char>>();
  Napi::Buffer<char> output = info[1].As<Napi::Buffer<char>>();

  Napi::Number result;
  uint32_t sIdx = 0;
  uint32_t eIdx = output.Length();
  switch (alen) {
  case 4:
    if (!info[3].IsNumber()) {
      Napi::TypeError::New(env, "Invalid endIdx").ThrowAsJavaScriptException();
      return env.Null();
    }
    eIdx = info[3].As<Napi::Number>().Uint32Value();
    // fall through
    [[fallthrough]];
  case 3:
    if (!info[2].IsNumber()) {
      Napi::TypeError::New(env, "Invalid startIdx").ThrowAsJavaScriptException();
      return env.Null();
    }
    sIdx = info[2].As<Napi::Number>().Uint32Value();
    // fall through
    [[fallthrough]];
  case 2:
    result = Napi::Number::New(env, LZ4_compress_default(input.Data(),
                                                        output.Data() + sIdx,
                                                        input.Length(),
                                                        eIdx - sIdx)
                            );
  }

  return result;
}

// {Buffer} input, {Buffer} output, {Integer} compressionLevel
Napi::Value LZ4CompressHC(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  uint32_t alen = info.Length();
  if (alen != 2 && alen != 3) {
    Napi::Error::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[0].IsBuffer() || !info[1].IsBuffer()) {
    Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  Napi::Buffer<char> input = info[0].As<Napi::Buffer<char>>();
  Napi::Buffer<char> output = info[1].As<Napi::Buffer<char>>();
  uint32_t compressionLevel = info[3].IsNumber() ? info[3].As<Napi::Number>().Uint32Value() : 9;

  Napi::Number result = Napi::Number::New(env, LZ4_compress_HC(input.Data(),
                                                         output.Data(),
                                                         input.Length(),
                                                         output.Length(),
                                                         compressionLevel)
                                         );
  return result;
}

// Advanced functions

// {Integer} Buffer size
Napi::Value LZ4CompressBound(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 1) {
    Napi::Error::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[0].IsNumber()) {
    Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  uint32_t size = info[0].As<Napi::Number>().Uint32Value();

  return Napi::Number::New(env, LZ4_compressBound(size));
}

// {Buffer} input, {Buffer} output, {Integer} maxOutputSize
Napi::Value LZ4CompressLimited(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 3) {
    Napi::Error::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[0].IsBuffer() || !info[1].IsBuffer()) {
    Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[2].IsNumber()) {
    Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  Napi::Buffer<char> input = info[0].As<Napi::Buffer<char>>();
  Napi::Buffer<char> output = info[1].As<Napi::Buffer<char>>();
  uint32_t size = info[2].As<Napi::Number>().Uint32Value();

  Napi::Number result = Napi::Number::New(env, LZ4_compress_default(input.Data(),
                                                                     output.Data(),
                                                                     input.Length(),
                                                                     size)
                                         );
  return result;
}

// {Buffer} input, {Buffer} output, {Integer} maxOutputSize, {Integer} compressionLevel
Napi::Value LZ4CompressHCLimited(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  uint32_t alen = info.Length();
  if (alen != 3 && alen != 4) {
    Napi::Error::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[0].IsBuffer() || !info[1].IsBuffer()) {
    Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[2].IsNumber()) {
    Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  Napi::Buffer<char> input = info[0].As<Napi::Buffer<char>>();
  Napi::Buffer<char> output = info[1].As<Napi::Buffer<char>>();
  uint32_t size = info[2].As<Napi::Number>().Uint32Value();
  uint32_t compressionLevel = info[3].IsNumber() ? info[3].As<Napi::Number>().Uint32Value() : 9;

  Napi::Number result = Napi::Number::New(env, LZ4_compress_HC(input.Data(),
                                                                       output.Data(),
                                                                       input.Length(),
                                                                       size,
                                                                       compressionLevel)
                                         );
  return result;
}

/*
//-----------------------------------------------------------------------------
// LZ4 Stream
//-----------------------------------------------------------------------------
// {Buffer} input
Napi::Value LZ4Stream_create(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 1) {
    Napi::Error::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[0].IsBuffer()) {
    Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  Napi::Buffer<char> input = info[0].As<Napi::Buffer<char>>();

  void* p = LZ4_create(input.Data());

  if (p == NULL) {
    return env.Null();
  }

  Napi::Buffer<char> handle = Napi::Buffer<char>::New(env, (char *)p, LZ4_sizeofStreamState());

  return handle;
}

// {Buffer} lz4 data struct, {Buffer} input, {Buffer} output
Napi::Value LZ4Stream_compress_continue(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 3) {
    Napi::Error::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[0].IsBuffer() || !info[1].IsBuffer() || !info[2].IsBuffer()) {
    Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  Napi::Buffer<char> lz4ds = info[0].As<Napi::Buffer<char>>();
  Napi::Buffer<char> input = info[1].As<Napi::Buffer<char>>();
  Napi::Buffer<char> output = info[2].As<Napi::Buffer<char>>();

  Napi::Number result = Napi::Number::New(env, LZ4_compress_continue(
                                            (LZ4_stream_t*)lz4ds.Data(),
                                            input.Data(),
                                            output.Data(),
                                            input.Length())
                                         );
  return result;
}

// {Buffer} input, {Buffer} lz4 data struct
Napi::Value LZ4Stream_slideInputBuffer(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 2) {
    Napi::Error::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[0].IsBuffer() || !info[1].IsBuffer()) {
    Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  Napi::Buffer<char> lz4ds = info[0].As<Napi::Buffer<char>>();
  Napi::Buffer<char> input = info[1].As<Napi::Buffer<char>>();

  // Pointer to the position into the input buffer where the next data block should go
  char* input_next_block = LZ4_slideInputBuffer(lz4ds.Data());
  char* input_current = (char *)input.Data();

  // Return the position of the next block
  return Napi::Number::New(env, (int)(input_next_block - input_current));
}

// {Buffer} lz4 data struct
Napi::Value LZ4Stream_free(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 1) {
    Napi::Error::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[0].IsBuffer()) {
    Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  Napi::Buffer<char> lz4ds = info[0].As<Napi::Buffer<char>>();
  int res = LZ4_freeStream( (LZ4_stream_t*) lz4ds .Data());

  return Napi::Number::New(env, res);
}
*/
//-----------------------------------------------------------------------------
// LZ4 Uncompress
//-----------------------------------------------------------------------------
// {Buffer} input, {Buffer} output
Napi::Value LZ4Uncompress(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  uint32_t alen = info.Length();
  if (alen < 2 || alen > 4) {
    Napi::Error::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[0].IsBuffer() || !info[1].IsBuffer()) {
    Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
    return env.Null();
  }
  Napi::Buffer<char> input = info[0].As<Napi::Buffer<char>>();
  Napi::Buffer<char> output = info[1].As<Napi::Buffer<char>>();

  Napi::Number result;
  uint32_t sIdx = 0;
  uint32_t eIdx = input.Length();
  switch (alen) {
  case 4:
    if (!info[3].IsNumber()) {
      Napi::TypeError::New(env, "Invalid endIdx").ThrowAsJavaScriptException();
      return env.Null();
    }
    if (!info[2].IsNumber()) {
      Napi::TypeError::New(env, "Invalid startIdx").ThrowAsJavaScriptException();
      return env.Null();
    }
    sIdx = info[2].As<Napi::Number>().Uint32Value();
    eIdx = info[3].As<Napi::Number>().Uint32Value();
    result = Napi::Number::New(env, LZ4_decompress_safe(input.Data() + sIdx,
                                                        output.Data(),
                                                 eIdx - sIdx,
                                                        output.Length())
                            );
    break;
  case 3:
    if (!info[2].IsNumber()) {
      Napi::TypeError::New(env, "Invalid startIdx").ThrowAsJavaScriptException();
      return env.Null();
    }
    sIdx = info[2].As<Napi::Number>().Uint32Value();
    [[fallthrough]];
  case 2:
    result = Napi::Number::New(env, LZ4_decompress_safe(input.Data() + sIdx,
                                                 output.Data(),
                                                 eIdx - sIdx,
                                                 output.Length())
                            );
  }

  return result;
}

// {Buffer} input, {Buffer} output
Napi::Value LZ4Uncompress_fast(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 2) {
    Napi::Error::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[0].IsBuffer() || !info[1].IsBuffer()) {
    Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  Napi::Buffer<char> input = info[0].As<Napi::Buffer<char>>();
  Napi::Buffer<char> output = info[1].As<Napi::Buffer<char>>();

#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
  Napi::Number result = Napi::Number::New(env, LZ4_decompress_fast(input.Data(),
                                                              output.Data(),
                                                              output.Length())
                                         );
#pragma GCC diagnostic pop
  return result;
}


Napi::Object init_lz4(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "compressBound"), Napi::Function::New(env, LZ4CompressBound));
  exports.Set(Napi::String::New(env, "compress"), Napi::Function::New(env, LZ4Compress));
  exports.Set(Napi::String::New(env, "compressLimited"), Napi::Function::New(env, LZ4CompressLimited));

  // exports.Set(Napi::String::New(env, "lz4s_create"), Napi::Function::New(env, LZ4Stream_create));
  // exports.Set(Napi::String::New(env, "lz4s_compress_continue"), Napi::Function::New(env, LZ4Stream_compress_continue));
  // exports.Set(Napi::String::New(env, "lz4s_slide_input"), Napi::Function::New(env, LZ4Stream_slideInputBuffer));
  // exports.Set(Napi::String::New(env, "lz4s_free"), Napi::Function::New(env, LZ4Stream_free));

  exports.Set(Napi::String::New(env, "compressHC"), Napi::Function::New(env, LZ4CompressHC));
  exports.Set(Napi::String::New(env, "compressHCLimited"), Napi::Function::New(env, LZ4CompressHCLimited));

  exports.Set(Napi::String::New(env, "uncompress"), Napi::Function::New(env, LZ4Uncompress));
  exports.Set(Napi::String::New(env, "uncompress_fast"), Napi::Function::New(env, LZ4Uncompress_fast));

  return exports;
}
NODE_API_MODULE(lz4_binding, init_lz4);
