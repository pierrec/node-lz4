{
  'targets': [
    {
      'target_name': 'xxhash',
      'cflags!': [ '-fno-exceptions' ],
      'cflags_cc!': [ '-fno-exceptions' ],
      'xcode_settings': { 'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
        'CLANG_CXX_LIBRARY': 'libc++',
        'MACOSX_DEPLOYMENT_TARGET': '10.7',
      },
      'msvs_settings': {
        'VCCLCompilerTool': { 'ExceptionHandling': 1 },
      },
      'sources': [
        'lib/binding/xxhash_binding.cc',
        'deps/lz4/lib/xxhash.h',
        'deps/lz4/lib/xxhash.c',
      ],
      'include_dirs': [
        '<!(node -p "require(\'node-addon-api\').include_dir")',
      ],
      'cflags': [ '-O3' ],
    },
    {
      'target_name': 'lz4',
      'cflags!': [ '-fno-exceptions' ],
      'cflags_cc!': [ '-fno-exceptions' ],
      'xcode_settings': { 'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
        'CLANG_CXX_LIBRARY': 'libc++',
        'MACOSX_DEPLOYMENT_TARGET': '10.7',
      },
      'msvs_settings': {
        'VCCLCompilerTool': { 'ExceptionHandling': 1 },
      },
      'sources': [
        'lib/binding/lz4_binding.cc',
        'deps/lz4/lib/lz4.h',
        'deps/lz4/lib/lz4.c',
        'deps/lz4/lib/lz4hc.h',
        'deps/lz4/lib/lz4hc.c',
      ],
      'include_dirs': [
        '<!(node -p "require(\'node-addon-api\').include_dir")',
      ],
      'cflags': [ '-O3' ],
    },
  ],
}
