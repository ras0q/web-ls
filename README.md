# web-ls

Browse the web as Markdown files. A Language Server Protocol (LSP)
implementation that turns web content into navigable documentation in your
editor.

## Quick Start

Load a Markdown file with web links and use your editor's LSP features to
navigate.

Supports any LSP-compatible editor: Neovim, VS Code, Emacs, Vim, etc.

## Features

- Convert web pages to Markdown for in-editor reading
- Cache pages locally for instant navigation
- Support for all LSP-compatible editors

## Installation

```bash
deno add jsr:@ras0q/web-ls
```

## Configuration

See [.nvim.lua](./.nvim.lua) for a Neovim example. For other editors, refer to
your editor's LSP configuration documentation.
