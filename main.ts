/**
 * Main entry point for web-ls.
 * Starts the LSP server.
 */

import { parseArgs } from "@std/cli/parse-args";
import { startLspServer } from "./src/lsp_server.ts";

const DEFAULT_CACHE_DIR = "/tmp/web-ls";

if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    string: ["cache-dir"],
  });

  const cacheDir = args["cache-dir"] ?? DEFAULT_CACHE_DIR;
  startLspServer(cacheDir);
}
