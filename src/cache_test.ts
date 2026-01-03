/**
 * Tests for cache management.
 */

import { assertEquals } from "@std/assert";
import { checkCache } from "./cache.ts";
import { join } from "@std/path";
import { ensureDir } from "@std/fs";
import { createHash } from "node:crypto";

const CACHE_DIR = "/tmp/crawl-ls";

function generateCacheHash(url: string): string {
  return createHash("sha256").update(url).digest("hex");
}

function getCachePath(url: string): string {
  const hash = generateCacheHash(url);
  const filename = `${hash}.md`;
  return join(CACHE_DIR, filename);
}

async function saveToCache(url: string, content: string): Promise<string> {
  await ensureDir(CACHE_DIR);
  const filepath = getCachePath(url);
  await Deno.writeTextFile(filepath, content);
  return filepath;
}

Deno.test({
  name: "Cache - check existing cached file",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const testUrl = "https://example.com/test-cache";
    const content = "# Test Content\n\nThis is a test.";

    // Create cache file
    await saveToCache(testUrl, content);

    // Check if cached
    const result = await checkCache(testUrl);
    assertEquals(typeof result, "string");
    assertEquals(result?.endsWith(".md"), true);
  },
});

Deno.test({
  name: "Cache - check non-existent file",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const testUrl = "https://never-cached-url-12345.com";

    const result = await checkCache(testUrl);
    assertEquals(result, null);
  },
});
