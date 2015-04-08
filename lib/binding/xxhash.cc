#include <string.h>
#include <stdlib.h>

#include <node.h>
#include <node_buffer.h>
#include <nan.h>

#include "../../deps/lz4/programs/xxhash.h"

using namespace node;
using namespace v8;

//-----------------------------------------------------------------------------
// xxHash
//-----------------------------------------------------------------------------
// {Buffer} input, {Integer} seed (optional)
NAN_METHOD(xxHash) {
  NanScope();

  if (args.Length() == 0) {
    NanThrowError(Exception::Error(NanNew<String>("Wrong number of arguments")));
    NanReturnUndefined();
  }

  if (!Buffer::HasInstance(args[0])) {
    NanThrowError(Exception::TypeError(NanNew<String>("Wrong argument: Buffer expected")));
    NanReturnUndefined();
  }

  Local<Object> input = args[0]->ToObject();
  uint32_t seed = 0;
  if (args[1]->IsUint32()) {
    seed = args[1]->Uint32Value();
  }

  Local<Integer> result = NanNew<Integer>(XXH32(Buffer::Data(input),
                                                Buffer::Length(input),
                                                seed)
                                         );
  NanReturnValue(result);
}

// {Integer} seed
NAN_METHOD(xxHash_init) {
  NanScope();

  if (args.Length() == 0) {
    NanThrowError(Exception::Error(NanNew<String>("Wrong number of arguments")));
    NanReturnUndefined();
  }

  if (!args[0]->IsUint32()) {
    NanThrowError(Exception::TypeError(NanNew<String>("Wrong argument: Integer expected")));
    NanReturnUndefined();
  }

  uint32_t seed = args[0]->Uint32Value();

  Local<Object> handle = NanNewBufferHandle( (char *)XXH32_init(seed), XXH32_sizeofState() );

  NanReturnValue(handle);
}

// {Buffer} state {Buffer} input {Integer} seed
NAN_METHOD(xxHash_update) {
  NanScope();

  if (args.Length() != 2) {
    NanThrowError(Exception::Error(NanNew<String>("Wrong number of arguments")));
    NanReturnUndefined();
  }

  if (!Buffer::HasInstance(args[0]) || !Buffer::HasInstance(args[1])) {
    NanThrowError(Exception::TypeError(NanNew<String>("Wrong arguments")));
    NanReturnUndefined();
  }

  int err_code = XXH32_update(
    Buffer::Data(args[0])
  , Buffer::Data(args[1])
  , Buffer::Length(args[1])
  );

  NanReturnValue(NanNew<Integer>(err_code));
}

// {Buffer} state
NAN_METHOD(xxHash_digest) {
  NanScope();

  if (args.Length() != 1) {
    NanThrowError(Exception::Error(NanNew<String>("Wrong number of arguments")));
    NanReturnUndefined();
  }

  if (!Buffer::HasInstance(args[0])) {
    NanThrowError(Exception::TypeError(NanNew<String>("Wrong arguments")));
    NanReturnUndefined();
  }

  Local<Integer> res = NanNew<Integer>(
    XXH32_digest( Buffer::Data(args[0]) )
  );

  NanReturnValue(res);
}

void init_xxhash(Handle<Object> target) {
  NanScope();

  target->Set(NanNew<String>("xxHash"), NanNew<FunctionTemplate>(xxHash)->GetFunction());
  target->Set(NanNew<String>("init"), NanNew<FunctionTemplate>(xxHash_init)->GetFunction());
  target->Set(NanNew<String>("update"), NanNew<FunctionTemplate>(xxHash_update)->GetFunction());
  target->Set(NanNew<String>("digest"), NanNew<FunctionTemplate>(xxHash_digest)->GetFunction());
}

NODE_MODULE(xxhash, init_xxhash)
