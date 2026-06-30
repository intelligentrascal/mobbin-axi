import { describe, it, expect } from 'vitest';
import { mapMcpError } from '../../src/errors.js';
import { parseTextContent } from '../../src/mcp/client.js';

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
