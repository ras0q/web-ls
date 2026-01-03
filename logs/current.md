# Current Project Status

**Last Updated:** 2026-01-04 01:22 JST

## Overview

CrawlLS is a Language Server Protocol (LSP) implementation for browsing web
content as Markdown files within TUI editors like Neovim.

## Implementation Progress

### ✅ Completed Phases (1-8)

| Phase | Title                         | Status | Key Deliverable                  |
| ----- | ----------------------------- | ------ | -------------------------------- |
| 1     | Fetcher Implementation        | ✅     | Pure fetch/convert functions     |
| 2     | LSP Protocol Walking Skeleton | ✅     | JSON-RPC over stdio              |
| 3     | LSP Server Simplification     | ✅     | Removed abstraction layers       |
| 4     | Definition Integration        | ✅     | Link extraction + cache checking |
| 5     | Cache Dir Refactoring         | ✅     | CLI `--cache-dir` argument       |
| 6     | Architecture Refactoring      | ✅     | Type/handler/IO separation       |
| 7     | Handler Output Pattern        | ✅     | Pure side effect handling        |
| 8     | Cache Key Readability         | ✅     | Domain-path cache structure      |

### Current Test Status

**All 23 tests passing ✓**

```
- cache_test.ts:                          2/2
- fetcher_test.ts:                        5/5
- handlers/initialize_test.ts:            2/2
- handlers/textDocument_definition_test.ts: 3/3
- link_parser_test.ts:                    6/6
- lsp_server_test.ts:                     5/5
```

### Architecture Summary

```
┌─────────────────────────────────────────┐
│         LSP Server (lsp_server.ts)      │
│  - JSON-RPC request routing             │
│  - Handler invocation & side effects    │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────────┬────────────────┐
        │                 │                │
   ┌────▼────────┐  ┌────▼──────┐  ┌─────▼──────┐
   │  Handlers   │  │ Link Parser│  │   Cache    │
   │  (pure)     │  │  (pure)    │  │ (file I/O) │
   └────┬────────┘  └────────────┘  └──────┬─────┘
        │                                   │
   ┌────▼──────────────────────────────────┘
   │
┌──▼──────────────────┐
│   Fetcher (pure)    │
│ - Fetch HTML        │
│ - Convert Markdown  │
│ - Detect external   │
└─────────────────────┘
```

### Key Files & LOC

| File                                      | Lines    | Role                     |
| ----------------------------------------- | -------- | ------------------------ |
| `src/lsp_server.ts`                       | 71       | Main LSP loop & routing  |
| `src/handlers/textDocument_definition.ts` | 88       | Definition handler       |
| `src/handlers/initialize.ts`              | 22       | Initialize handler       |
| `src/fetcher.ts`                          | 117      | Pure fetch/convert       |
| `src/cache.ts`                            | 66       | File cache ops           |
| `src/link_parser.ts`                      | 28       | Markdown link extraction |
| `src/io/message.ts`                       | 59       | JSON-RPC message I/O     |
| `main.ts`                                 | 22       | CLI entry point          |
| **Total**                                 | **~500** |                          |

### Dependencies

**Core:**

- `deno` 2.x
- `arktype` ^2.1.29 - Type validation
- `defuddle` 0.6.6 - HTML extraction
- `vscode-languageserver-protocol` ^3.17.5 - LSP types

**Standard Library:**

- `@std/fs` - Directory/file operations
- `@std/path` - Path utilities
- `@std/cli` - CLI argument parsing
- `@std/assert` - Testing

### Implemented LSP Features

- ✅ `initialize` - Advertise capabilities
- ✅ `textDocument/definition` - Navigate to cached markdown
- ✅ `window/showDocument` - Open external URLs in browser
- ❌ `textDocument/didOpen` - (Prefetch queue pending)
- ❌ `textDocument/didChange` - (Not yet implemented)
- ❌ `textDocument/didClose` - (Not yet implemented)

### Cache Structure

```
~/.cache/crawl-ls/
├── example.com/
│   ├── index.md
│   └── article.md
├── github.com/
│   └── user/repo.md
└── stackoverflow.com/
    └── help/minimal-reproducible-example.md
```

### Code Quality

- ✅ Type safety: No `as` type casting, runtime validation with arktype
- ✅ Pure functions: Most logic is side-effect free
- ✅ TDD approach: Tests written before implementation
- ✅ YAGNI principle: Only necessary features implemented
- ✅ All checks pass: `deno fmt`, `deno lint`, `deno check`

## Known Limitations

1. **Message buffering**: `readMessage()` assumes complete messages in single
   read
2. **URL parsing**: Only `[text](url)` markdown format supported
3. **Relative URLs**: No URL resolution relative to page context
4. **No cache TTL**: Cached files persist indefinitely
5. **No concurrent access control**: No locking for simultaneous writes
6. **Special characters**: Paths with special chars need escaping

## Next Steps (Priority Order)

### Phase 9: Background Prefetching Queue (High Priority)

- Implement `PrefetchQueue` class
- Hook `textDocument/didOpen` lifecycle
- Extract all links and queue for background processing
- Add rate limiting and sequential processing

### Phase 10: LSP Lifecycle Events (Medium Priority)

- Handle `textDocument/didChange` for document updates
- Implement `textDocument/didClose` for cleanup
- Track open documents in memory

### Phase 11: Production Readiness (Medium Priority)

- Message buffering across multiple reads
- Integration tests with actual LSP client
- Error recovery and reconnection logic

### Phase 12: Observability (Low Priority)

- Cache metrics (hit rate, total size)
- Performance logging
- Debug mode for troubleshooting

## Development Guidelines

- Always run `deno test -P` before committing
- Always run `deno task check:fix` to format/lint
- Write tests first (TDD)
- Keep pure functions separate from side effects
- Update `logs/current.md` after each phase

## Getting Started (For Future Developers)

```bash
# Install dependencies
deno cache --reload deno.jsonc

# Run tests
deno test -P

# Start LSP server
deno task dev

# With custom cache directory
deno task dev -- --cache-dir ~/.cache/crawl-ls

# Code quality checks
deno task check:fix
```

## Architecture Decisions

### Why pure functions?

- Testable without mocks
- Composable and reusable
- Easier to reason about

### Why domain-based cache keys?

- Readable filesystem structure
- Debuggable by inspection
- No hash computation overhead

### Why handler output pattern?

- Separates business logic from side effects
- Allows multiple server requests per handler
- Pure context objects

### Why arktype validation?

- Runtime type safety without `as` casting
- Clear error messages for invalid data
- Reusable validators

## Recent Changes Summary

**Latest commit:** `f0d8bba breaking!: improve cache key readability`

- Changed from hash-based to domain-path cache structure
- Removed cache operations from fetcher module
- Simplified API: fetcher now pure transformation only
- Reduced code by 85 lines (57% deletion)
- All tests still passing
