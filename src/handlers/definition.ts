/**
 * textDocument/definition request handler for LSP server.
 */

import type { DefinitionParams, Location } from "vscode-languageserver";
import type { LspContext } from "../types/lsp.ts";
import { extractUrl } from "../services/link_parser.ts";
import { checkCache, getCachePath, saveToCache } from "../cache.ts";
import { fetchUrl } from "../fetcher.ts";

/**
 * Handle textDocument/definition request.
 * Returns cached markdown file location or null.
 */
export async function handleDefinition(
  params: DefinitionParams,
  context: LspContext,
): Promise<Location | null> {
  const urlWithRange = await extractUrl(params);
  if (!urlWithRange) {
    return null;
  }

  const { url } = urlWithRange;

  // Check cache first
  const cachePath = getCachePath(url, context.cacheDir);
  const cached = await checkCache(cachePath);

  // If not cached, fetch it
  if (!cached) {
    const fetchResult = await fetchUrl(url);

    if (fetchResult.isExternal) {
      // Send window/showDocument request via context connection
      await context.connection.sendRequest("window/showDocument", {
        uri: url,
        external: true,
      });
      return null;
    }

    await saveToCache(cachePath, fetchResult.content);
  }

  // Return location of cached markdown file
  return {
    uri: `file://${cachePath}`,
    range: {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 0 },
    },
  };
}
