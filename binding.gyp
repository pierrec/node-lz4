{
  'targets': [
    {
      'target_name': 'lz4',
      'include_dirs': [ 'deps/lz4' ],
      'sources': [
        'lib/binding.cc',
        'deps/lz4/lz4.h',
        'deps/lz4/lz4.c',
        'deps/lz4/lz4hc.h',
        'deps/lz4/lz4hc.c',
      ],
      'cflags': [ '-O3' ],
    },
  ],
}
