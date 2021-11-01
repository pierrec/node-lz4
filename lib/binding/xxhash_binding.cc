#define NAPI_VERSION 3
#include <napi.h>

#define XXH_PRIVATE_API

#include "../../deps/lz4/lib/xxhash.h"

//-----------------------------------------------------------------------------
// xxHash
//-----------------------------------------------------------------------------
// {Buffer} input, {Integer} seed (optional)
Napi::Value xxHash(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  if (info.Length() == 0) {
    Napi::Error::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[0].IsBuffer()) {
    Napi::TypeError::New(env, "Wrong argument: Buffer expected").ThrowAsJavaScriptException();
    return env.Null();
  }

  Napi::Buffer<char> input = info[0].As<Napi::Buffer<char>>();
  uint32_t seed = 0;
  if (info[1].IsNumber()) {
    seed = info[1].As<Napi::Number>().Uint32Value();
  }

  Napi::Number result = Napi::Number::New(env, XXH32(input.Data(),
                                                     input.Length(),
                                                     seed)
  );
  return result;
}

// {Integer} seed
Napi::Value xxHash_init(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  if (info.Length() == 0) {
    Napi::Error::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[0].IsNumber()) {
    Napi::TypeError::New(env, "Wrong argument: Integer expected").ThrowAsJavaScriptException();
    return env.Null();
  }

  uint32_t seed = info[0].As<Napi::Number>().Uint32Value();

  XXH32_state_t* state = XXH32_createState();
  XXH32_reset(state, seed);
  Napi::Buffer<char> handle = Napi::Buffer<char>::New(env, (char *) state, sizeof(XXH32_state_t));

  return handle;
}

// {Buffer} state {Buffer} input {Integer} seed
Napi::Value xxHash_update(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  if (info.Length() != 2) {
    Napi::Error::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[0].IsBuffer() || !info[1].IsBuffer()) {
    Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  Napi::Buffer<char> data0 = info[0].As<Napi::Buffer<char>>();
  Napi::Buffer<char> data1 = info[1].As<Napi::Buffer<char>>();

  int err_code = XXH32_update(
          (XXH32_state_t *) data0.Data(),
          data1.Data(),
          data1.Length()
  );

  return Napi::Number::New(env, err_code);
}

// {Buffer} state
Napi::Value xxHash_digest(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  if (info.Length() != 1) {
    Napi::Error::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[0].IsBuffer()) {
    Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  Napi::Number res = Napi::Number::New(env,
                                       XXH32_digest((XXH32_state_t *) info[0].As<Napi::Buffer<char>>().Data())
  );

  return res;
}

Napi::Object init_xxhash(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "xxHash"), Napi::Function::New(env, xxHash));
  exports.Set(Napi::String::New(env, "init"), Napi::Function::New(env, xxHash_init));
  exports.Set(Napi::String::New(env, "update"), Napi::Function::New(env, xxHash_update));
  exports.Set(Napi::String::New(env, "digest"), Napi::Function::New(env, xxHash_digest));

  return exports;
}

NODE_API_MODULE(xxhash, init_xxhash);