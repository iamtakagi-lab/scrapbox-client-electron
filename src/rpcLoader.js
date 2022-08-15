// 参照: https://github.com/ci7lus/miraktest-plugins/blob/master/src/miraktest-drpc/rpcLoader.js

if (typeof window === "undefined") {
    exports["RPC"] = require("discord-rpc")
  } else {
    exports["RPC"] = {}
  }