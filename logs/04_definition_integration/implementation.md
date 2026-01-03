# Implementation Log: Step 3 - Wiring It Up (Definition Integration)

**Date:** 2026-01-03

## Summary

Connected LSP `textDocument/definition` handler to Fetcher with Markdown link
parsing. Implemented full TDD workflow with pure functions.

## Implementation

### Phase 1: Link Parser (`src/link_parser.ts`)

**Pure function** for extracting Markdown links at cursor position:

- `extractLinkAtPosition(line, character)` - Extract URL from `[text](url)` at
  position
- Regex pattern: `\[([^\]]+)\]\(([^)]+?)\)` with non-greedy URL matching
- Handles multiple links on same line, returns link containing cursor
- Returns `null` if no link found at position

**Tests** (`src/link_parser_test.ts`): 6/6 passing

- Cursor on text part, URL part, outside link
- Multiple links, return closest
- Parentheses in text

### Phase 2: Cache Management (`src/cache.ts`)

**Pure function** for checking cached files:

- `checkCache(url)` - Returns cache path if exists, `null` otherwise
- Uses `Deno.stat()` for file existence check
- Copied `generateCacheHash()` and `getCachePath()` from fetcher to avoid
  circular dependency

**Tests** (`src/cache_test.ts`): 2/2 passing

- Check existing cached file
- Check non-existent file
- Note: Requires `sanitizeOps: false, sanitizeResources: false` for file I/O

### Phase 3: Definition Handler Integration (`src/lsp_server.ts`)

**Async handler** implementation:

1. Parse `DefinitionParams` from request
2. Read document content from file URI
3. Extract link at cursor position using `extractLinkAtPosition()`
4. Check cache with `checkCache(url)`
5. If not cached, call `fetchUrl(url)`
6. If external URL: Send `window/showDocument` request, return `null`
7. If internal: Return `Location` with cached file URI

**Updates**:

- Made `handleDefinition()` async
- Made `processRequest()` async
- Added `await` in `startLspServer()`

**Tests** (`src/lsp_server_test.ts`): 3/3 passing

- Initialize request (existing)
- Definition request format (existing)
- Definition with link extraction (new integration test)

## Technical Decisions

### Link Parsing Strategy

- Regex-based extraction: Simple and efficient
- Non-greedy matching for URL part to handle edge cases
- Character-based boundary checking for cursor position

### Cache Path Generation

- Duplicated functions in `cache.ts` to avoid circular dependency
- Alternative: Could extract to shared `utils.ts`, but YAGNI for now
- Trade-off: Small duplication vs. added complexity

### Document Text Retrieval

- Read directly from file system using URI
- Alternative: In-memory document store (defer to Step 4 with prefetching)
- Simple and works for MVP

### External URL Handling

- Send `window/showDocument` JSON-RPC request to client
- Format: `{ method: "window/showDocument", params: { uri, external: true } }`
- Client decides how to open (browser, etc.)

### Error Handling

- Try-catch in `handleDefinition()` returns `null` on error
- Logs errors to stderr for debugging
- Graceful degradation: Better UX than crashing

## Test Results

**18/18 tests passing** across all modules:

```
✓ 6 link_parser tests
✓ 2 cache tests
✓ 3 lsp_server tests
✓ 7 fetcher tests (from Step 1)
```

All tests run with `deno test -P` (full permissions). Code formatting and
linting checks pass.

## File Structure

```
src/
  link_parser.ts       - Markdown link extraction (28 lines)
  link_parser_test.ts  - 6 unit tests
  cache.ts             - Cache checking (45 lines)
  cache_test.ts        - 2 integration tests
  lsp_server.ts        - Full definition handler (220 lines)
  lsp_server_test.ts   - 3 tests (format + integration)
  fetcher.ts           - (from Step 1)
  fetcher_test.ts      - (from Step 1)
```

## Key Technologies

### LSP Protocol

- `DefinitionParams`: `{ textDocument: { uri }, position: { line, character } }`
- `Location`: `{ uri, range: { start, end } }`
- `window/showDocument`: Client request for opening external URLs

### Deno APIs

- `Deno.readTextFile()` - Read document content
- `Deno.stat()` - Check file existence
- `Deno.writeTextFile()` - Write cache files

### Regex Patterns

- Markdown link: `\[([^\]]+)\]\(([^)]+?)\)`
- Non-greedy `?` for URL to handle malformed cases

## What the Next Developer Needs to Know

### Architecture Flow

1. Client sends `textDocument/definition` with cursor position
2. Server reads file, extracts link at position
3. Checks cache → Fetches if needed → Returns location or opens in browser
4. All pure functions, easy to test and extend

### Adding New Link Types

- Extend `extractLinkAtPosition()` regex for other formats
- Examples: `<url>`, reference-style `[text][ref]`, etc.

### Performance Considerations

- File I/O on every definition request (acceptable for MVP)
- No caching of document content (will add in Step 4)
- Sequential processing (no concurrency yet)

### Known Limitations

- Only handles `[text](url)` format
- No relative URL resolution (requires base URL context)
- No link validation (malformed URLs will fail at fetch)
- Reads entire file on each request (inefficient for large files)

## Lessons Learned

1. **Pure functions are easy to test**: All link parsing logic tested
   independently
2. **Avoid circular dependencies**: Duplicating small functions is sometimes
   simpler
3. **Async propagation**: One async function requires parent chain to be async
4. **Test sanitization**: File I/O tests need `sanitizeOps: false`
5. **TDD workflow**: Write failing test → Implement → Refactor worked perfectly

## Next Steps

**Step 4: Background Prefetching**

1. Implement `PrefetchQueue` class for low-priority background fetching
2. Add in-memory document store for `textDocument/didOpen` tracking
3. Extract all links from opened documents and queue for prefetching
4. Add rate limiting and sequential processing
5. Integration test: Open document → verify links prefetched

---

**Status:** ✅ Complete - All tests passing, full definition support working
