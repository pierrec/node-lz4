{
  'targets': [
    {
      'target_name': 'xxhash',
      'sources': [
        'lib/binding/xxhash.cc',
        'deps/lz4/programs/xxhash.h',
        'deps/lz4/programs/xxhash.c',
      ],
      'cflags': [ '-O3' ],
    },
    {
      'target_name': 'lz4',
      'sources': [
        'lib/binding/lz4.cc',
        'deps/lz4/lz4.h',
        'deps/lz4/lz4.c',
        'deps/lz4/lz4hc.h',
        'deps/lz4/lz4hc.c',
      ],
      'cflags': [ '-O3' ],
    },
  ],
}
