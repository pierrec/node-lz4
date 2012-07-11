{
  'targets': [
    {
      'target_name': 'lz4',
      'include_dirs': [ 'deps/lz4' ],
      'sources': [
        'lib/lz4.cc',
        'deps/lz4/lz4.h',
        'deps/lz4/lz4.c',
      ],
      'cflags': [ '-O3' ],
    },
  ],
}
