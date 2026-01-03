/**
 * Tests for LSP server request processing.
 */

import { assertEquals } from "@std/assert";
import { processRequest } from "./lsp_server.ts";
import type { JsonRpcRequest } from "./types/jsonrpc.ts";
import type { LspContext } from "./types/lsp.ts";

const mockContext: LspContext = {
  cacheDir: "/tmp/crawl-ls-test-cache",
};

Deno.test("processRequest - initialize method", async () => {
  const request: JsonRpcRequest = {
    jsonrpc: "2.0",
    method: "initialize",
    params: {
      processId: null,
      rootUri: "file:///test",
      capabilities: {},
    },
    id: 1,
  };

  const output = await processRequest(request, mockContext);

  assertEquals(output.response.jsonrpc, "2.0");
  assertEquals(output.response.id, 1);
  assertEquals(output.response.error, undefined);
  assertEquals(output.serverRequest, undefined);

  const { result } = output.response;
  assertEquals(
    typeof result === "object" &&
      result &&
      "capabilities" in result &&
      typeof result.capabilities === "object" &&
      result.capabilities &&
      "definitionProvider" in result.capabilities &&
      typeof result.capabilities.definitionProvider === "boolean" &&
      result.capabilities.definitionProvider === true,
    true,
  );
});

Deno.test("processRequest - unknown method", async () => {
  const request: JsonRpcRequest = {
    jsonrpc: "2.0",
    method: "unknown/method",
    id: 2,
  };

  const output = await processRequest(request, mockContext);

  assertEquals(output.response.jsonrpc, "2.0");
  assertEquals(output.response.id, 2);
  assertEquals(output.response.result, undefined);
  assertEquals(output.response.error !== undefined, true);
  assertEquals(output.response.error!.code, -32601);
  assertEquals(
    output.response.error!.message.includes("Method not found"),
    true,
  );
  assertEquals(output.serverRequest, undefined);
});

Deno.test({
  name: "processRequest - textDocument/definition with no link",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const testFile = "/tmp/crawl-ls-server-test-1.md";
    const testContent = "Plain text without links";
    await Deno.writeTextFile(testFile, testContent);

    try {
      const request: JsonRpcRequest = {
        jsonrpc: "2.0",
        method: "textDocument/definition",
        params: {
          textDocument: { uri: `file://${testFile}` },
          position: { line: 0, character: 5 },
        },
        id: 3,
      };

      const output = await processRequest(request, mockContext);

      assertEquals(output.response.jsonrpc, "2.0");
      assertEquals(output.response.id, 3);
      assertEquals(output.response.result, null);
      assertEquals(output.serverRequest, undefined);
    } finally {
      try {
        await Deno.remove(testFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  },
});

Deno.test({
  name: "processRequest - textDocument/definition beyond file bounds",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const testFile = "/tmp/crawl-ls-server-test-2.md";
    const testContent = "Single line";
    await Deno.writeTextFile(testFile, testContent);

    try {
      const request: JsonRpcRequest = {
        jsonrpc: "2.0",
        method: "textDocument/definition",
        params: {
          textDocument: { uri: `file://${testFile}` },
          position: { line: 100, character: 0 },
        },
        id: 4,
      };

      const output = await processRequest(request, mockContext);

      assertEquals(output.response.jsonrpc, "2.0");
      assertEquals(output.response.id, 4);
      assertEquals(output.response.result, null);
      assertEquals(output.serverRequest, undefined);
    } finally {
      try {
        await Deno.remove(testFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  },
});

Deno.test({
  name: "processRequest - textDocument/definition with external URL",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const testFile = "/tmp/crawl-ls-server-test-3.md";
    const testContent = "See [Example](https://example.com) for details";
    await Deno.writeTextFile(testFile, testContent);

    try {
      const request: JsonRpcRequest = {
        jsonrpc: "2.0",
        method: "textDocument/definition",
        params: {
          textDocument: { uri: `file://${testFile}` },
          position: { line: 0, character: 20 },
        },
        id: 5,
      };

      const output = await processRequest(request, mockContext);

      assertEquals(output.response.jsonrpc, "2.0");
      assertEquals(output.response.id, 5);
      // Result should be either null or a Location object
      assertEquals(
        typeof output.response.result === "object" ||
          output.response.result === null,
        true,
      );
    } finally {
      try {
        await Deno.remove(testFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  },
});
