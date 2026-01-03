/**
 * Tests for Markdown link parser.
 */

import { assertEquals } from "@std/assert";
import { extractLinkAtPosition } from "./link_parser.ts";

Deno.test("Link Parser - extract link at cursor position", () => {
  const line = "Visit [example](https://example.com) here";
  const result = extractLinkAtPosition(line, 10); // cursor on "example"
  assertEquals(result, "https://example.com");
});

Deno.test("Link Parser - no link at position", () => {
  const line = "No link here";
  const result = extractLinkAtPosition(line, 5);
  assertEquals(result, null);
});

Deno.test("Link Parser - cursor on URL part", () => {
  const line = "Visit [example](https://example.com) here";
  const result = extractLinkAtPosition(line, 25); // cursor on URL
  assertEquals(result, "https://example.com");
});

Deno.test("Link Parser - multiple links, return closest", () => {
  const line = "[first](https://first.com) and [second](https://second.com)";
  const result1 = extractLinkAtPosition(line, 5); // in first link
  assertEquals(result1, "https://first.com");

  const result2 = extractLinkAtPosition(line, 40); // in second link
  assertEquals(result2, "https://second.com");
});

Deno.test("Link Parser - cursor outside any link", () => {
  const line = "[first](https://first.com) and [second](https://second.com)";
  const result = extractLinkAtPosition(line, 28); // on " and "
  assertEquals(result, null);
});

Deno.test("Link Parser - handle parentheses in text", () => {
  const line = "See (note) and [valid](https://example.com) here";
  const result = extractLinkAtPosition(line, 25); // on valid link
  assertEquals(result, "https://example.com");
});
