/**
 * LSP Server for CrawlLS.
 * Implements JSON-RPC protocol over stdin/stdout.
 */

import type {
  InitializeResult,
  Location,
  ServerCapabilities,
} from "vscode-languageserver-protocol";

interface JsonRpcRequest {
  jsonrpc: string;
  method: string;
  params?: unknown;
  id?: number;
}

interface JsonRpcResponse {
  jsonrpc: string;
  id?: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Stdio interface for dependency injection in tests.
 */
export interface Stdio {
  write(data: string): void;
  read(): string | undefined;
}

/**
 * Default stdio implementation using actual stdin/stdout.
 */
class RealStdio implements Stdio {
  private decoder = new TextDecoder();
  private buffer = "";

  write(data: string): void {
    const encoder = new TextEncoder();
    Deno.stdout.writeSync(encoder.encode(data));
  }

  read(): string | undefined {
    // This is a simplified implementation
    // In a real LSP server, we'd need proper message parsing
    const buf = new Uint8Array(1024);
    const n = Deno.stdin.readSync(buf);
    if (n === null) return undefined;

    this.buffer += this.decoder.decode(buf.slice(0, n));

    // Simple message extraction (not production ready)
    const match = this.buffer.match(/Content-Length: (\d+)\r\n\r\n(.+)/);
    if (match && match[2].length >= parseInt(match[1])) {
      const message = match[2].slice(0, parseInt(match[1]));
      this.buffer = this.buffer.slice(match[0].length);
      return message;
    }

    return undefined;
  }
}

/**
 * Send a JSON-RPC response.
 */
function sendResponse(stdio: Stdio, response: JsonRpcResponse) {
  const content = JSON.stringify(response);
  const message = `Content-Length: ${content.length}\r\n\r\n${content}`;
  stdio.write(message);
}

/**
 * Handle initialize request.
 */
function handleInitialize(request: JsonRpcRequest, stdio: Stdio) {
  const result: InitializeResult = {
    capabilities: {
      definitionProvider: true,
    } satisfies ServerCapabilities,
  };

  const response: JsonRpcResponse = {
    jsonrpc: "2.0",
    id: request.id,
    result,
  };
  sendResponse(stdio, response);
}

/**
 * Handle textDocument/definition request.
 */
function handleDefinition(request: JsonRpcRequest, stdio: Stdio) {
  // For now, return empty result
  // This will be connected to the fetcher in Step 3
  const result: Location | Location[] | null = null;

  const response: JsonRpcResponse = {
    jsonrpc: "2.0",
    id: request.id,
    result,
  };
  sendResponse(stdio, response);
}

/**
 * Process a single JSON-RPC request.
 */
function processRequest(request: JsonRpcRequest, stdio: Stdio) {
  switch (request.method) {
    case "initialize":
      handleInitialize(request, stdio);
      break;
    case "textDocument/definition":
      handleDefinition(request, stdio);
      break;
    default:
      // Unknown method - send error response
      if (request.id !== undefined) {
        const response: JsonRpcResponse = {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`,
          },
        };
        sendResponse(stdio, response);
      }
      break;
  }
}

/**
 * Start the LSP server with the given stdio interface.
 */
export async function startLspServer(stdio: Stdio = new RealStdio()) {
  while (true) {
    const message = stdio.read();
    if (!message) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      continue;
    }

    try {
      const request: JsonRpcRequest = JSON.parse(message);
      processRequest(request, stdio);
    } catch (error) {
      // Invalid JSON - ignore or send error response
      console.error("Failed to parse JSON-RPC message:", error);
    }
  }
}

/**
 * Main entry point when run directly.
 */
if (import.meta.main) {
  await startLspServer();
}
