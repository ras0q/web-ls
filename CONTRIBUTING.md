# Contribution Guidelines

We welcome contributions to this project!
Please follow these guidelines to ensure a smooth collaboration process.

## Start with an Issue

Before submitting a pull request, please open an issue to discuss your proposed changes.
This helps us understand the context and ensures that your contribution aligns with the project's goals.

For bug reports, please provide a [minimal reproduction](https://stackoverflow.com/help/minimal-reproducible-example) and describe your environment in detail.

## Development Setup

### Requirements
- Deno 2.x

### Getting Started

`// WIP`

```bash
# Run tests
deno test

# Run the language server
deno task dev
```

## Development Guidelines

### Code Style
- **Prefer pure functions over classes**: Use functional programming style where possible
- Keep functions simple and composable
- Avoid stateful classes unless absolutely necessary for LSP server implementation
- Follow Kent Beck's principles: TDD, simplicity ("Do the Simplest Thing That Could Possibly Work"), YAGNI

### Dependency Management
- **Always use `deno add` command** to add dependencies, never edit `deno.jsonc` manually
- Examples:
  ```bash
  deno add npm:package-name@version
  deno add jsr:@scope/package@version
  ```
- This ensures proper version resolution and lock file updates

### Testing
- Write tests before implementation (TDD approach)
- Test pure functions individually for better coverage
- Run tests with: `deno test`
- All tests must pass before submitting a PR

### Development Logs

All implementation work is documented in the `logs/` directory. After completing a task or feature:

1. Create a new folder in `logs/` with a descriptive name (e.g., `01_fetcher_implementation/`)
2. Add an `implementation.md` file documenting:
   - What was done
   - Technical decisions made
   - Test results
   - Lessons learned
   - Next steps

This helps track progress and provides context for future development (especially useful when working with AI coding agents).

