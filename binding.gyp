{
  'targets': [
    {
      'target_name': '<(module_name)',
      'sources': [
        'lib/binding/lz4_binding.cc',
        'lib/binding/xxhash_binding.cc',
        'lib/binding/xxhash_binding.h',
        'deps/lz4/lib/xxhash.h',
        'deps/lz4/lib/xxhash.c',
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
    {
      'target_name': 'action_after_build',
      'type': 'none',
      'dependencies': [ '<(module_name)' ],
      'copies': [
        {
          'files': [ '<(PRODUCT_DIR)/<(module_name).node' ],
          'destination': '<(module_path)'
        }
      ]
    }
  ],
}
