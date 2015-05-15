{
  'targets': [
    {
      'target_name': 'xxhash',
      'sources': [
        'lib/binding/xxhash_binding.cc',
        'deps/lz4/lib/xxhash.h',
        'deps/lz4/lib/xxhash.c',
      ],
      'include_dirs': [
        '<!(node -e "require(\'nan\')")'
      ],
      'cflags': [ '-O3' ],
    },
    {
      'target_name': 'lz4',
      'sources': [
        'lib/binding/lz4_binding.cc',
        'deps/lz4/lib/lz4.h',
        'deps/lz4/lib/lz4.c',
        'deps/lz4/lib/lz4hc.h',
        'deps/lz4/lib/lz4hc.c',
      ],
      'include_dirs': [
        '<!(node -e "require(\'nan\')")'
      ],
      'cflags': [ '-O3' ],
    },
  ],
}
