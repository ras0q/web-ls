/**
 * Initialize request handler for LSP server.
 */

import type {
  InitializeResult,
  ServerCapabilities,
} from "vscode-languageserver-protocol";
import type { JsonRpcRequest } from "../types/jsonrpc.ts";
import type { HandlerOutput } from "../types/handler.ts";

/**
 * Handle initialize request.
 */
export function handleInitialize(request: JsonRpcRequest): HandlerOutput {
  const result: InitializeResult = {
    capabilities: {
      definitionProvider: true,
    } satisfies ServerCapabilities,
  };

  return {
    response: {
      jsonrpc: "2.0",
      id: request.id,
      result,
    },
  };
}
