/**
 * Tests for link_parser service.
 * Tests markdown link extraction and URL parsing functionality.
 */

import { assertEquals } from "@std/assert";
import { extractUrl } from "./link_parser.ts";
import type { TextDocumentPositionParams } from "vscode-languageserver";

/**
 * Helper function to create test file and params
 */
async function createTestFile(
  fileName: string,
  content: string,
): Promise<string> {
  const testFile = `/tmp/link-parser-test-${fileName}`;
  await Deno.writeTextFile(testFile, content);
  return testFile;
}

/**
 * Helper to create TextDocumentPositionParams
 */
function createParams(
  uri: string,
  line: number,
  character: number,
): TextDocumentPositionParams {
  return {
    textDocument: { uri: `file://${uri}` },
    position: { line, character },
  };
}

/**
 * Test: Markdown link extraction - [text](url)
 */
Deno.test({
  name: "extractUrl - markdown link [text](url) format",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const testFile = await createTestFile(
      "markdown-link.md",
      "Check [Example](https://example.com) here",
    );

    try {
      // "Check [Example](https://example.com) here"
      // Position 15 is inside the link
      const params = createParams(testFile, 0, 15);
      const result = await extractUrl(params);

      assertEquals(result !== null, true);
      assertEquals(result?.url, "https://example.com");
      assertEquals(result?.range.start.line, 0);
      assertEquals(result?.range.start.character, 6);
      assertEquals(result?.range.end.character, 36);
    } finally {
      await Deno.remove(testFile);
    }
  },
});

/**
 * Test: Autolink extraction - <url>
 */
Deno.test({
  name: "extractUrl - autolink <url> format",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const testFile = await createTestFile(
      "autolink.md",
      "Visit <https://api.example.com> for more",
    );

    try {
      // "Visit <https://api.example.com> for more"
      // Position 15 is inside the URL
      const params = createParams(testFile, 0, 15);
      const result = await extractUrl(params);

      assertEquals(result !== null, true);
      assertEquals(result?.url, "https://api.example.com");
      assertEquals(result?.range.start.character, 6);
      assertEquals(result?.range.end.character, 31);
    } finally {
      await Deno.remove(testFile);
    }
  },
});

/**
 * Test: Plain URL extraction
 */
Deno.test({
  name: "extractUrl - plain URL format (https://...)",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const testFile = await createTestFile(
      "plain-url.md",
      "Check this out https://docs.example.com/guide",
    );

    try {
      const params = createParams(testFile, 0, 25); // Position inside URL
      const result = await extractUrl(params);

      assertEquals(result !== null, true);
      assertEquals(result?.url, "https://docs.example.com/guide");
      assertEquals(result?.range.start.character, 15);
    } finally {
      await Deno.remove(testFile);
    }
  },
});

/**
 * Test: HTTP (not HTTPS) plain URL
 */
Deno.test({
  name: "extractUrl - plain HTTP URL (http://...)",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const testFile = await createTestFile(
      "http-url.md",
      "Old site http://example.com is deprecated",
    );

    try {
      // "Old site http://example.com is deprecated"
      // Position 15 is inside the URL
      const params = createParams(testFile, 0, 15);
      const result = await extractUrl(params);

      assertEquals(result !== null, true);
      assertEquals(result?.url, "http://example.com");
    } finally {
      await Deno.remove(testFile);
    }
  },
});

/**
 * Test: No link found at position
 */
Deno.test({
  name: "extractUrl - no link at cursor position",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const testFile = await createTestFile(
      "no-link.md",
      "This is plain text without any links",
    );

    try {
      const params = createParams(testFile, 0, 5);
      const result = await extractUrl(params);

      assertEquals(result, null);
    } finally {
      await Deno.remove(testFile);
    }
  },
});

/**
 * Test: Position on non-existent line
 */
Deno.test({
  name: "extractUrl - position on non-existent line",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const testFile = await createTestFile(
      "short-file.md",
      "Only one line here",
    );

    try {
      const params = createParams(testFile, 10, 0); // Line 10 doesn't exist
      const result = await extractUrl(params);

      assertEquals(result, null);
    } finally {
      await Deno.remove(testFile);
    }
  },
});

/**
 * Test: Multiple links on same line - cursor on first
 */
Deno.test({
  name: "extractUrl - multiple links on same line (first link)",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const testFile = await createTestFile(
      "multi-link.md",
      "[First](https://first.example.com) and [Second](https://second.example.com)",
    );

    try {
      const params = createParams(testFile, 0, 10); // Cursor on first link
      const result = await extractUrl(params);

      assertEquals(result !== null, true);
      assertEquals(result?.url, "https://first.example.com");
    } finally {
      await Deno.remove(testFile);
    }
  },
});

/**
 * Test: Multiple links on same line - cursor on second
 */
Deno.test({
  name: "extractUrl - multiple links on same line (second link)",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const testFile = await createTestFile(
      "multi-link-2.md",
      "[First](https://first.example.com) and [Second](https://second.example.com)",
    );

    try {
      const params = createParams(testFile, 0, 55); // Cursor on second link
      const result = await extractUrl(params);

      assertEquals(result !== null, true);
      assertEquals(result?.url, "https://second.example.com");
    } finally {
      await Deno.remove(testFile);
    }
  },
});

/**
 * Test: URL with query parameters
 */
Deno.test({
  name: "extractUrl - URL with query parameters",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const testFile = await createTestFile(
      "query-url.md",
      "[Search](https://api.example.com/search?q=test&lang=en)",
    );

    try {
      // "[Search](https://api.example.com/search?q=test&lang=en)"
      // Position 25 is inside the URL part
      const params = createParams(testFile, 0, 25);
      const result = await extractUrl(params);

      assertEquals(result !== null, true);
      assertEquals(
        result?.url,
        "https://api.example.com/search?q=test&lang=en",
      );
    } finally {
      await Deno.remove(testFile);
    }
  },
});

/**
 * Test: URL with fragment identifier
 */
Deno.test({
  name: "extractUrl - URL with fragment identifier",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const testFile = await createTestFile(
      "fragment-url.md",
      "[Link](https://docs.example.com/page#section)",
    );

    try {
      const params = createParams(testFile, 0, 15);
      const result = await extractUrl(params);

      assertEquals(result !== null, true);
      assertEquals(result?.url, "https://docs.example.com/page#section");
    } finally {
      await Deno.remove(testFile);
    }
  },
});

/**
 * Test: Position at link boundary (start)
 */
Deno.test({
  name: "extractUrl - cursor at link start boundary",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const testFile = await createTestFile(
      "boundary-start.md",
      "Text [Link](https://api.example.com) end",
    );

    try {
      // "Text [Link](https://api.example.com) end"
      // Position 5 is at '[', should match
      const params = createParams(testFile, 0, 5);
      const result = await extractUrl(params);

      assertEquals(result !== null, true);
      assertEquals(result?.url, "https://api.example.com");
    } finally {
      await Deno.remove(testFile);
    }
  },
});

/**
 * Test: Position at link boundary (end)
 */
Deno.test({
  name: "extractUrl - cursor at link end boundary",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const testFile = await createTestFile(
      "boundary-end.md",
      "Text [Link](https://api.example.com) end",
    );

    try {
      // "Text [Link](https://api.example.com) end"
      // Position 35 is just before closing ')'
      const params = createParams(testFile, 0, 35);
      const result = await extractUrl(params);

      assertEquals(result !== null, true);
      assertEquals(result?.url, "https://api.example.com");
    } finally {
      await Deno.remove(testFile);
    }
  },
});

/**
 * Test: Multiline document - cursor on second line
 */
Deno.test({
  name: "extractUrl - multiline document with link on line 2",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const testFile = await createTestFile(
      "multiline.md",
      "First line\n[Link](https://mail.example.com) here\nThird line",
    );

    try {
      const params = createParams(testFile, 1, 10); // Line 1 (0-indexed), inside link
      const result = await extractUrl(params);

      assertEquals(result !== null, true);
      assertEquals(result?.url, "https://mail.example.com");
      assertEquals(result?.range.start.line, 1);
    } finally {
      await Deno.remove(testFile);
    }
  },
});
