#ifndef XXHASH_BINDING_H_INCLUDED
#define XXHASH_BINDING_H_INCLUDED

#include <node.h>
#include <nan.h>

void xxHash(const Nan::FunctionCallbackInfo<v8::Value>& info);
void xxHash_init(const Nan::FunctionCallbackInfo<v8::Value>& info);
void xxHash_update(const Nan::FunctionCallbackInfo<v8::Value>& info);
void xxHash_digest(const Nan::FunctionCallbackInfo<v8::Value>& info);

#endif /* XXHASH_BINDING_H_INCLUDED */
