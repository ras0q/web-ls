# CrawlLS

A Language Server Protocol (LSP) implementation for browsing the web as a graph of Markdown files in TUI editors like Neovim.

## Features

- Fetch web pages and convert them to Markdown
- Navigate between web pages using LSP's "Go to Definition" feature
- Background prefetching for faster navigation
- Smart detection of external resources (videos, etc.)

## Requirements

- Deno 2.x

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines and how to get started.

## Architecture

- **Fetcher**: Core logic for fetching and converting web pages to Markdown
- **LSP Server**: JSON-RPC over stdio implementation
- **Prefetch Queue**: Background processing for link prefetching

## Technology Stack

- Runtime: Deno 2
- Language: TypeScript
- Libraries:
  - `defuddle`: HTML content extraction
  - `turndown`: HTML to Markdown conversion
  - Native `fetch` for HTTP requests
