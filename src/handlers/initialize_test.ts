/**
 * Tests for initialize handler.
 */

import { assertEquals } from "@std/assert";
import { handleInitialize } from "./initialize.ts";
import type { JsonRpcRequest } from "../types/jsonrpc.ts";

Deno.test("initialize handler - returns capabilities", () => {
  const request: JsonRpcRequest = {
    jsonrpc: "2.0",
    method: "initialize",
    id: 1,
  };

  const output = handleInitialize(request);

  assertEquals(output.response.jsonrpc, "2.0");
  assertEquals(output.response.id, 1);
  if (
    output.response.result &&
    typeof output.response.result === "object" &&
    "capabilities" in output.response.result
  ) {
    const result = output.response.result as Record<string, unknown>;
    const capabilities = result.capabilities as Record<string, unknown>;
    assertEquals(capabilities.definitionProvider, true);
  }
  assertEquals(output.serverRequest, undefined);
});

Deno.test("initialize handler - returns handler output without server request", () => {
  const request: JsonRpcRequest = {
    jsonrpc: "2.0",
    method: "initialize",
    id: "test-id",
  };

  const output = handleInitialize(request);

  assertEquals(output.response.jsonrpc, "2.0");
  assertEquals(output.response.id, "test-id");
  assertEquals(output.serverRequest, undefined);
});
