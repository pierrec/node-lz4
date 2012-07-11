cmd_Release/lz4.node := ln -f "Release/obj.target/lz4.node" "Release/lz4.node" 2>/dev/null || (rm -rf "Release/lz4.node" && cp -af "Release/obj.target/lz4.node" "Release/lz4.node")
