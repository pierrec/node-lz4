#include <string.h>
#include <stdlib.h>

#include <node.h>
#include <node_buffer.h>

#include "../../deps/lz4/programs/xxhash.h"

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

  Buffer *buf = Buffer::New( (char *)XXH32_init(seed), XXH32_sizeofState() );

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

void init_xxhash(Handle<Object> target) {
  NODE_SET_METHOD(target, "xxHash", xxHash);
  NODE_SET_METHOD(target, "init", xxHash_init);
  NODE_SET_METHOD(target, "update", xxHash_update);
  NODE_SET_METHOD(target, "digest", xxHash_digest);
}

NODE_MODULE(xxhash, init_xxhash)