/**
 * Shared MCP response helpers.
 * All tool handlers return ToolResult — either a success payload or an error.
 */

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: true;
}

/** Wrap a successful result as an MCP text content response. */
export function ok(data: unknown): ToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

/** Wrap a caught error as an MCP error response. */
export function fail(err: unknown): ToolResult {
  const msg = err instanceof Error ? err.message : String(err);
  return {
    content: [{ type: 'text', text: msg }],
    isError: true,
  };
}
