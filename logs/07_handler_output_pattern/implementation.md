# Implementation of Handler Output Pattern

## Overview

Based on LSP specification, changed handler return values to use the
`HandlerOutput` pattern. This allows sending server-to-client requests (e.g.,
`window/showDocument`) while keeping the Context pure.

## LSP Specification Verification

### Requests Must Always Return a Response

From the LSP specification:

> **If a request doesn't provide a result value the receiver of a request still
> needs to return a response message to conform to the JSON-RPC specification.**

In other words:

- When receiving a `textDocument/definition` request, **must always return a
  response with the same `id`**
- `result: null` is acceptable (when no definition is found)

### Server → Client Requests

- `window/showDocument` is a **server-to-client request**
- **Independent** from the `textDocument/definition` response
- Sent with a different `id` (or without one)

## Implementation Details

### 1. New Type Definition: `HandlerOutput`

```typescript
// src/types/handler.ts
export interface HandlerOutput {
  response: JsonRpcResponse;
  serverRequest?: Omit<JsonRpcRequest, "id">;
}
```

**Characteristics:**

- `response`: Response to client (required, with `id`)
- `serverRequest`: Request sent from server to client (optional, `id` not
  needed)

### 2. Updated Handler Return Values

```typescript
// src/handlers/textDocument_definition.ts
export async function handleTextDocumentDefinition(
  request: JsonRpcRequest,
  context: LspContext,
): Promise<HandlerOutput> {
  // ...

  if (fetchResult.isExternal) {
    return {
      response: {
        jsonrpc: "2.0",
        id: request.id,
        result: null,
      },
      serverRequest: {
        jsonrpc: "2.0",
        method: "window/showDocument",
        params: {
          uri: url,
          external: true,
        },
      },
    };
  }
  // ...
}
```

### 3. Server-Side Side Effect Processing

```typescript
// src/lsp_server.ts - startLspServer function
const output = await processRequest(validatedRequest, context);

// Send response
writeMessage(output.response);

// Send server request
if (output.serverRequest) {
  writeMessage(output.serverRequest);
}
```

### 4. Extended `writeMessage`

```typescript
// src/io/message.ts
export function writeMessage(
  message: JsonRpcResponse | Omit<JsonRpcRequest, "id">,
): void {
  // ...
  const content = JSON.stringify(message);
  const messageStr = `Content-Length: ${content.length}\r\n\r\n${content}`;
  // ...
}
```

### 5. Updated Tests

Updated all tests to support `HandlerOutput` return values:

- `initialize_test.ts`: 2 tests ✅
- `textDocument_definition_test.ts`: 3 tests ✅
- `lsp_server_test.ts`: 5 tests ✅

## Architecture Advantages

### ✅ Context is Pure

- `LspContext` has no side effect functions
- Read-only data only

### ✅ Handlers are Pure

- Input → `HandlerOutput` output only
- No side effects

### ✅ Side Effects are Explicit

- Centrally managed in `startLspServer`
- Sent via `writeMessage`

### ✅ High Extensibility

- Can support multiple server requests
- Easy to add new methods

## Data Flow

```
Client
    ↓
readMessage() → JSON-RPC Request
    ↓
processRequest() → HandlerOutput {
  response: JsonRpcResponse,
  serverRequest?: Omit<JsonRpcRequest, "id">
}
    ↓
writeMessage(output.response) → Send response to client
    ↓
writeMessage(output.serverRequest?) → Send server request (if needed)
    ↓
Client
```

## Concrete Example: External URL Processing Flow

```
1. Client → textDocument/definition request (id: 123)
   {
     "jsonrpc": "2.0",
     "id": 123,
     "method": "textDocument/definition",
     "params": { ... }
   }

2. Server → textDocument/definition response (id: 123)
   {
     "jsonrpc": "2.0",
     "id": 123,
     "result": null
   }

3. Server → window/showDocument request (no id)
   {
     "jsonrpc": "2.0",
     "method": "window/showDocument",
     "params": {
       "uri": "https://example.com",
       "external": true
     }
   }
```

## Test Results

✅ **All 25 tests passed**

```
ok | 25 passed | 0 failed (5s)
```

✅ **Quality Checks**

- Deno format: ✓
- Deno lint: ✓
- Type checking: ✓

## File Changes Summary

**Files Created:**

- `src/types/handler.ts` - `HandlerOutput` type definition

**Files Modified:**

- `src/handlers/initialize.ts` - Changed return type to `HandlerOutput`
- `src/handlers/textDocument_definition.ts` - Changed return type to
  `HandlerOutput`, implemented external URL handling
- `src/lsp_server.ts` - Changed `processRequest` return type to `HandlerOutput`,
  integrated side effect handling
- `src/io/message.ts` - `writeMessage` now supports both requests and responses
- `src/handlers/initialize_test.ts` - Updated to `HandlerOutput` tests
- `src/handlers/textDocument_definition_test.ts` - Updated to `HandlerOutput`
  tests
- `src/lsp_server_test.ts` - Updated to `HandlerOutput` tests

## Design Essence

The core of this pattern:

**Separation of Concerns**

- Handlers: Pure business logic (input → output)
- Server: Side effect management (I/O operations)

**Functional Programming Principles**

- Use of pure functions
- Explicit side effects
- Single responsibility principle

## Future Extensions

This architecture easily supports:

- Multiple server requests (could be made into arrays)
- Additional messaging features (notifications, etc.)
- Integration with async processing
- Enhanced error handling

## Conclusion

Achieved flexible side effect handling while maintaining purity.

✅ Context is completely pure (read-only) ✅ Handlers are completely pure (input
→ output) ✅ Side effects centrally managed in `startLspServer` ✅ Fully
compliant with LSP specification ✅ All tests passed
