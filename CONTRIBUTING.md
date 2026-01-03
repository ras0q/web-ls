# Contribution Guidelines

We welcome contributions to this project! Please follow these guidelines to
ensure a smooth collaboration process.

## Start with an Issue

Before submitting a pull request, please open an issue to discuss your proposed
changes. This helps us understand the context and ensures that your contribution
aligns with the project's goals.

For bug reports, please provide a
[minimal reproduction](https://stackoverflow.com/help/minimal-reproducible-example)
and describe your environment in detail.

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

- **Prefer pure functions over classes**: Use functional programming style where
  possible
- Keep functions simple and composable
- Avoid stateful classes unless absolutely necessary for LSP server
  implementation
- Follow Kent Beck's principles: TDD, simplicity ("Do the Simplest Thing That
  Could Possibly Work"), YAGNI

### Type Checking and Type Guards

- **Never use `as` for type casting**: Use runtime type checks instead
  - ✅ Good: `typeof value === "object" && "property" in value`
  - ✅ Good: `value instanceof SomeClass`
  - ❌ Bad: `value as SomeType`
- Type guards should be explicit and runtime-safe
- Prefer `typeof` and `in` operator for object property checking
- Use `instanceof` for class instance checking with arktype validators

### Dependency Management

- **Always use `deno add` command** to add dependencies, never edit `deno.jsonc`
  manually
- Examples:
  ```bash
  deno add npm:package-name@version
  deno add jsr:@scope/package@version
  ```
- This ensures proper version resolution and lock file updates

### Testing

- Write tests before implementation (TDD approach)
- Test pure functions individually for better coverage
- Run tests with: `deno test -P`
  - Use the `-P` flag to apply default permissions from `deno.jsonc`:
    `deno test -P`
  - This enables tests to run with configured permissions (file access, env
    access, etc.)
- All tests must pass before submitting a PR

### Development Logs

All implementation work is documented in the `logs/` directory. After completing
a task or feature:

1. Create a new folder in `logs/` with a descriptive name (e.g.,
   `01_fetcher_implementation/`)
2. Add an `implementation.md` file documenting:
   - What was done
   - Technical decisions made
   - Test results
   - Lessons learned
   - Next steps

**Important**: Keep logs **concise and precise**. Remove trial-and-error details
and verbose explanations. Focus on:

- Final implementation state
- Key technologies and usage examples
- Critical decisions and configurations
- What the next developer needs to know

Goal: Future coding agents should understand the state in **30 seconds** with
**minimal tokens**.

**After updating logs**: Always run `deno task check:fix` to ensure the log
files follow proper formatting standards.

### Current Status File

**Important for Token Efficiency**: Maintain `logs/current.md` to reduce future
token consumption.

- **Purpose**: Single source of truth for project status, reducing need to read
  multiple log files
- **Update frequency**: After each completed phase/feature
- **Content**:
  - Current implementation progress with phase checkmarks
  - Test status summary (counts, pass/fail)
  - Architecture overview (diagram or text)
  - Key files and line counts
  - Current limitations
  - Next steps (prioritized)
  - Recent changes summary

**Before starting work**: Read `logs/current.md` first (quick overview in ~30
seconds)

**After completing work**: Update `logs/current.md` with:

1. Move completed phase to ✅ section
2. Update test counts
3. Add new section for completed phase if significant
4. Update "Recent Changes Summary" section
5. Adjust "Next Steps" priority list

This approach significantly reduces context requirements for future agents
compared to reading individual phase logs.

### Before Committing

Always run these commands before committing:

```bash
# Run all tests in parallel
deno test -P

# Check and fix code formatting/linting
deno task check:fix
```

All checks must pass before creating a pull request.
