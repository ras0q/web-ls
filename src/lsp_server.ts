/**
 * LSP Server for CrawlLS.
 * Implements JSON-RPC protocol over stdin/stdout.
 */

import type {
  DefinitionParams,
  InitializeResult,
  Location,
  ServerCapabilities,
} from "vscode-languageserver-protocol";
import { extractLinkAtPosition } from "./link_parser.ts";
import { checkCache } from "./cache.ts";
import { fetchUrl } from "./fetcher.ts";

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
 * Write a JSON-RPC response to stdout.
 */
function writeMessage(response: JsonRpcResponse): void {
  const content = JSON.stringify(response);
  const message = `Content-Length: ${content.length}\r\n\r\n${content}`;
  const encoder = new TextEncoder();
  Deno.stdout.writeSync(encoder.encode(message));
}

/**
 * Handle initialize request.
 */
function handleInitialize(request: JsonRpcRequest) {
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
  writeMessage(response);
}

/**
 * Handle textDocument/definition request.
 */
async function handleDefinition(request: JsonRpcRequest) {
  const params = request.params as DefinitionParams;

  try {
    // Get document URI and position
    const documentUri = params.textDocument.uri;
    const position = params.position;

    // Read document content from file
    const filePath = documentUri.replace("file://", "");
    const content = await Deno.readTextFile(filePath);
    const lines = content.split("\n");

    // Get line at cursor position
    if (position.line >= lines.length) {
      const response: JsonRpcResponse = {
        jsonrpc: "2.0",
        id: request.id,
        result: null,
      };
      writeMessage(response);
      return;
    }

    const line = lines[position.line];

    // Extract link at cursor position
    const url = extractLinkAtPosition(line, position.character);

    if (!url) {
      // No link found
      const response: JsonRpcResponse = {
        jsonrpc: "2.0",
        id: request.id,
        result: null,
      };
      writeMessage(response);
      return;
    }

    // Check cache first
    let cachePath = await checkCache(url);

    // If not cached, fetch it
    if (!cachePath) {
      const fetchResult = await fetchUrl(url);

      if (fetchResult.isExternal) {
        // Send window/showDocument request for external URLs
        const showDocRequest = {
          jsonrpc: "2.0",
          method: "window/showDocument",
          params: {
            uri: url,
            external: true,
          },
        };
        writeMessage(showDocRequest);

        // Return null for the definition
        const response: JsonRpcResponse = {
          jsonrpc: "2.0",
          id: request.id,
          result: null,
        };
        writeMessage(response);
        return;
      }

      cachePath = fetchResult.path;
    }

    // Return location of cached markdown file
    const location: Location = {
      uri: `file://${cachePath}`,
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
      },
    };

    const response: JsonRpcResponse = {
      jsonrpc: "2.0",
      id: request.id,
      result: location,
    };
    writeMessage(response);
  } catch (error) {
    // Error handling
    console.error("Definition handler error:", error);
    const response: JsonRpcResponse = {
      jsonrpc: "2.0",
      id: request.id,
      result: null,
    };
    writeMessage(response);
  }
}

/**
 * Process a single JSON-RPC request.
 */
async function processRequest(request: JsonRpcRequest) {
  switch (request.method) {
    case "initialize":
      handleInitialize(request);
      break;
    case "textDocument/definition":
      await handleDefinition(request);
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
        writeMessage(response);
      }
      break;
  }
}

/**
 * Read a single LSP message from stdin.
 */
async function readMessage(): Promise<string | null> {
  const buf = new Uint8Array(1024);
  const n = await Deno.stdin.read(buf);
  if (n === null) return null;

  const decoder = new TextDecoder();
  const chunk = decoder.decode(buf.slice(0, n));

  // Parse Content-Length header and extract message
  const match = chunk.match(/Content-Length: (\d+)\r\n\r\n(.+)/);
  if (match) {
    const contentLength = parseInt(match[1]);
    return match[2].slice(0, contentLength);
  }

  return null;
}

/**
 * Start the LSP server.
 */
export async function startLspServer() {
  while (true) {
    const message = await readMessage();
    if (!message) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      continue;
    }

    try {
      const request: JsonRpcRequest = JSON.parse(message);
      await processRequest(request);
    } catch (error) {
      // Invalid JSON - ignore or send error response
      console.error("Failed to parse JSON-RPC message:", error);
    }
  }
}
