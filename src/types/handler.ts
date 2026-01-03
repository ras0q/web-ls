/**
 * Handler return type and utilities.
 */

import type { JsonRpcRequest, JsonRpcResponse } from "./jsonrpc.ts";

/**
 * Output from a handler function.
 * - response: The response to send back to the client
 * - serverRequest: Optional request to send from server to client (without id)
 */
export interface HandlerOutput {
  response: JsonRpcResponse;
  serverRequest?: Omit<JsonRpcRequest, "id">;
}
