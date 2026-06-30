import { AxiError, exitCodeForError } from 'axi-sdk-js';
export { AxiError, exitCodeForError };

export function mapMcpError(error: unknown): AxiError {
  const msg = error instanceof Error ? error.message : String(error);
  if (/unauthor/i.test(msg) || /401/.test(msg)) {
    return new AxiError('Not authenticated with Mobbin', 'AUTH_REQUIRED', ['Run `mobbin-axi login`']);
  }
  return new AxiError(msg || 'Mobbin MCP request failed', 'MCP_ERROR');
}
