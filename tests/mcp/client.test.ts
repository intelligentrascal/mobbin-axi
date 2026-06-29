import { describe, it, expect } from 'vitest';
import { mapMcpError } from '../../src/errors.js';

describe('mapMcpError', () => {
  it('maps 401/unauthorized to AUTH_REQUIRED with a login hint', () => {
    const e = mapMcpError(new Error('HTTP 401 Unauthorized'));
    expect(e.code).toBe('AUTH_REQUIRED');
    expect(e.suggestions).toContain('Run `mobbin-axi login`');
  });
  it('maps other errors to MCP_ERROR', () => {
    expect(mapMcpError(new Error('boom')).code).toBe('MCP_ERROR');
  });
});
