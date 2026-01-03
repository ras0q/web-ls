/**
 * Main entry point for CrawlLS.
 * Starts the LSP server.
 */

import { startLspServer } from "./src/lsp_server.ts";

if (import.meta.main) {
  await startLspServer();
}
