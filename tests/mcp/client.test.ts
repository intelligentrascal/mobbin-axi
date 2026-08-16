import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mapMcpError } from '../../src/errors.js';
import { parseTextContent } from '../../src/mcp/client.js';

// isError handling via callTool
vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    callTool: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));
vi.mock('@modelcontextprotocol/sdk/client/streamableHttp.js', () => ({
  StreamableHTTPClientTransport: vi.fn(),
}));
vi.mock('../../src/auth/store.js', () => ({
  loadCredentials: vi.fn().mockReturnValue({ tokens: { access_token: 'tok' } }),
}));
vi.mock('../../src/auth/provider.js', () => ({
  MobbinOAuthProvider: vi.fn().mockImplementation(() => ({})),
}));

describe('callTool isError handling', () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  it('throws AxiError with MCP_ERROR when isError is true', async () => {
    const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
    const mockCallTool = vi.fn().mockResolvedValue({
      isError: true,
      content: [{ type: 'text', text: 'Tool execution failed: rate limited' }],
    });
    (Client as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      callTool: mockCallTool,
      close: vi.fn().mockResolvedValue(undefined),
    }));
    const { callTool } = await import('../../src/mcp/client.js');
    await expect(callTool('search_screens', {})).rejects.toThrow('Tool execution failed: rate limited');
  });

  it('throws AxiError with generic message when isError=true but no text content', async () => {
    const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
    (Client as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      callTool: vi.fn().mockResolvedValue({ isError: true, content: [] }),
      close: vi.fn().mockResolvedValue(undefined),
    }));
    const { callTool } = await import('../../src/mcp/client.js');
    await expect(callTool('search_screens', {})).rejects.toThrow('MCP tool returned an error');
  });
});

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

describe('parseTextContent', () => {
  it('returns raw result when content is not an array (e.g. a string)', () => {
    const raw = { content: 'oops' };
    expect(parseTextContent(raw)).toBe(raw);
  });

  it('returns raw result when content is null/undefined', () => {
    const raw = { content: null };
    expect(parseTextContent(raw)).toBe(raw);
  });

  it('returns parsed JSON from text content item', () => {
    const raw = { content: [{ type: 'text', text: '{"a":1}' }] };
    expect(parseTextContent(raw)).toEqual({ a: 1 });
  });

  it('returns raw result when text is missing', () => {
    const raw = { content: [{ type: 'image', data: '...' }] };
    expect(parseTextContent(raw)).toBe(raw);
  });

  it('returns { text } when JSON.parse fails', () => {
    const raw = { content: [{ type: 'text', text: 'not-json' }] };
    expect(parseTextContent(raw)).toEqual({ text: 'not-json' });
  });

  it('returns raw result when content is an empty array', () => {
    const raw = { content: [] };
    expect(parseTextContent(raw)).toBe(raw);
  });
});
