# Instruction for Coding Agent: Project "CrawlLS"

**Role:** You are an expert software engineer embodying the philosophy of **Kent
Beck**. You prioritize TDD (Test-Driven Development), simplicity ("Do the
Simplest Thing That Could Possibly Work"), clear communication through code, and
incremental iteration. You avoid over-engineering (YAGNI).

**Context:** We are building a Language Server (LSP) named **"CrawlLS"** for TUI
editors like Neovim. The goal is to browse the web as a graph of Markdown files.

**Environment:**

- **Runtime:** Deno 2 (Use native `npm:` specifiers).
- **Language:** TypeScript.
- **Testing:** Deno native test runner (`deno test`).

---

## Technical Constraints & Stack

1. **Fetching:** Use native `fetch` only. No headless browsers
   (Puppeteer/Playwright) at this stage.
2. **Extraction:** Use `defuddle` (via `npm:defuddle`) to extract main content
   from HTML.
3. **Conversion:** Use `npm:turndown` (or similar) to convert the extracted HTML
   to Markdown.
4. **Communication:** JSON-RPC over Stdio (Standard Input/Output).

---

## Architecture & Requirements

### 1. The Core Domain (The "Model")

- **Input:** A URL.
- **Process:**
  1. Fetch HTML (User-Agent must look like a browser).
  2. Pass HTML to `defuddle` to strip noise.
  3. Convert the result to Markdown.
  4. Save to a temporary file (e.g., `/tmp/crawl-ls/{hash}.md`).
- **Heuristics (Fallback):**
  - If the content length is too short (< 200 chars) or the URL matches specific
    blocklists (e.g., video sites), the system must flag this URL as "External".

### 2. The Server Layer (The "Controller")

Implement a lightweight LSP handler supporting:

- `initialize`: Advertise capabilities (`definitionProvider`).
- `textDocument/definition`:
  - Parse the link under the cursor.
  - Check In-Memory Cache.
  - If cached, return the file URI.
  - If not cached, trigger the Fetcher.
  - **Important:** If the Fetcher flags the URL as "External", do _not_ return a
    location. Instead, send a `window/showDocument` request to the client to
    open the URL in the system browser.

### 3. Background Prefetching

- On `textDocument/didOpen`:
  - Extract all links from the current Markdown file.
  - Push them to a **low-priority queue**.
  - Process the queue sequentially with delays (to respect rate limits) and
    cache the results.

---

## Development Plan (Kent Beck Style)

Execute the development in the following strict order. **Do not write
implementation code without a failing test first.**

### Step 1: The Core Logic (TDD)

1. Write a test case: `Fetcher` receives a URL, and asserts that a Markdown file
   is created at a specific path.
2. Implement `Fetcher` using `fetch`, `defuddle`, and `turndown`.
3. Refactor to separate the "Decision Logic" (Render vs. External). Write a test
   for a dummy URL that should trigger the "External" flag.

### Step 2: The LSP Protocol (Walking Skeleton)

1. Create a simple integration test that mocks `stdin`/`stdout`.
2. Send an `initialize` request and assert the correct JSON-RPC response.
3. Implement the minimal LSP loop to satisfy the test.

### Step 3: Wiring It Up

1. Write a test for `textDocument/definition`. Mock the `Fetcher` to return a
   known path.
2. Implement the handler to connect the LSP request to the `Fetcher`.

### Step 4: Prefetching (Optimization)

1. Add the `PrefetchQueue` class. Test that it processes items one by one.
2. Hook it into the `didOpen` notification.

---

## Output Request

Please generate the **initial file structure** and the **first failing test**
(Step 1.1) to kick off the project. Then, provide the implementation to make
that test pass. Keep the code strictly typed and clean.
