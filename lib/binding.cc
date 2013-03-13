#include <node.h>
#include <node_buffer.h>

#include "../deps/lz4/lz4.h"
#include "../deps/lz4/lz4hc.h"

using namespace node;
using namespace v8;

// input Buffer, output Buffer
Handle<Value> Compress(const Arguments& args) {
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

// input Buffer, output Buffer
Handle<Value> CompressHC(const Arguments& args) {
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

// input Buffer size
Handle<Value> CompressBound(const Arguments& args) {
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

// input Buffer, output Buffer
Handle<Value> Uncompress(const Arguments& args) {
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

  Local<Integer> result = Integer::NewFromUnsigned(LZ4_uncompress(Buffer::Data(input),
                                                            Buffer::Data(output),
                                                            Buffer::Length(output))
                                                );
  return scope.Close(result->ToUint32());
}

// input Buffer, output Buffer
Handle<Value> Uncompress_unknownOutputSize(const Arguments& args) {
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
  NODE_SET_METHOD(target, "compress", Compress);
  NODE_SET_METHOD(target, "compressHC", CompressHC);
  NODE_SET_METHOD(target, "compressBound", CompressBound);
  NODE_SET_METHOD(target, "uncompress", Uncompress);
  NODE_SET_METHOD(target, "uncompress_unknownOutputSize", Uncompress_unknownOutputSize);
}

NODE_MODULE(lz4, init_lz4)