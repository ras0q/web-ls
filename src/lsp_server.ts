/**
 * LSP Server for CrawlLS.
 * Implements JSON-RPC protocol over stdin/stdout.
 */

import { type } from "arktype";

import type { JsonRpcRequest } from "./types/jsonrpc.ts";
import { JsonRpcRequest as JsonRpcRequestValidator } from "./types/jsonrpc.ts";
import type { LspContext } from "./types/lsp.ts";
import type { HandlerOutput } from "./types/handler.ts";
import { readMessage, writeMessage } from "./io/message.ts";
import { handleInitialize } from "./handlers/initialize.ts";
import { handleTextDocumentDefinition } from "./handlers/textDocument_definition.ts";

/**
 * Validate and process a single JSON-RPC request and return handler output.
 */
export async function processRequest(
  request: JsonRpcRequest,
  context: LspContext,
): Promise<HandlerOutput> {
  try {
    switch (request.method) {
      case "initialize":
        return handleInitialize(request);
      case "textDocument/definition":
        return await handleTextDocumentDefinition(
          request,
          context,
        );
      default:
        return {
          response: {
            jsonrpc: "2.0",
            id: request.id,
            error: {
              code: -32601,
              message: `Method not found: ${request.method}`,
            },
          },
        } satisfies HandlerOutput;
    }
  } catch (error) {
    console.error("Handler error:", error);
    return {
      response: {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32603,
          message: "Internal error",
        },
      },
    } satisfies HandlerOutput;
  }
}

/**
 * Start the LSP server.
 * Handles all side effects (I/O operations).
 */
export async function startLspServer(context: LspContext) {
  while (true) {
    const message = await readMessage();
    if (!message) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      continue;
    }

    const request = JSON.parse(message);
    const validatedRequest = JsonRpcRequestValidator(request);
    if (validatedRequest instanceof type.errors) {
      console.error(
        "Received invalid JSON-RPC request:",
        validatedRequest.summary,
      );
      continue;
    }

    const output = await processRequest(validatedRequest, context);

    // Send response to client
    writeMessage(output.response);

    // If handler generated a server request, send it
    if (output.serverRequest) {
      writeMessage(output.serverRequest);
    }
  }
}
