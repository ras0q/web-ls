/**
 * JSON-RPC message I/O utilities.
 */

import { type } from "arktype";
import type { JsonRpcRequest, JsonRpcResponse } from "../types/jsonrpc.ts";
import { JsonRpcResponse as JsonRpcResponseValidator } from "../types/jsonrpc.ts";

/**
 * Write a JSON-RPC message (request or response) to stdout.
 */
export function writeMessage(
  message: JsonRpcResponse | Omit<JsonRpcRequest, "id">,
): void {
  // For response, validate it
  if ("result" in message || "error" in message) {
    const validatedResponse = JsonRpcResponseValidator(
      message as JsonRpcResponse,
    );
    if (validatedResponse instanceof type.errors) {
      console.error("Invalid JSON-RPC response:", validatedResponse.summary);
      return;
    }
  }
  // For server-initiated requests, no id is needed so we just write them

  const content = JSON.stringify(message);
  const messageStr = `Content-Length: ${content.length}\r\n\r\n${content}`;
  const encoder = new TextEncoder();
  Deno.stdout.writeSync(encoder.encode(messageStr));
}

/**
 * Read a single LSP message from stdin.
 */
export async function readMessage(): Promise<string | null> {
  const decoder = new TextDecoder();
  let buffer = "";
  let contentLength = 0;
  let headerParsed = false;

  // First, read the headers and find Content-Length
  while (!headerParsed) {
    const chunk = new Uint8Array(512);
    const bytesRead = await Deno.stdin.read(chunk);
    if (bytesRead === null) return null;

    buffer += decoder.decode(chunk.slice(0, bytesRead));

    // Look for end of headers (\r\n\r\n)
    const headerEndIdx = buffer.indexOf("\r\n\r\n");
    if (headerEndIdx !== -1) {
      const headers = buffer.substring(0, headerEndIdx);
      buffer = buffer.substring(headerEndIdx + 4); // Remove headers and separator

      // Parse Content-Length
      const match = headers.match(/Content-Length: (\d+)/);
      if (match) {
        contentLength = parseInt(match[1]);
        headerParsed = true;
      } else {
        return null; // No Content-Length header found
      }
    }
  }

  // Now read the exact amount of content specified by Content-Length
  while (buffer.length < contentLength) {
    const chunk = new Uint8Array(512);
    const bytesRead = await Deno.stdin.read(chunk);
    if (bytesRead === null) return null;

    buffer += decoder.decode(chunk.slice(0, bytesRead));
  }

  return buffer.substring(0, contentLength);
}
