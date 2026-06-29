import { describe, it, expect } from 'vitest';
import { MCP_URL, TOOLS, CREDENTIALS_PATH } from '../src/config.js';

describe('config', () => {
  it('points at the Mobbin MCP', () => {
    expect(MCP_URL).toBe('https://api.mobbin.com/mcp');
  });
  it('lists all 9 tool names', () => {
    expect(Object.values(TOOLS)).toContain('mobbin_quick_search');
    expect(Object.values(TOOLS)).toHaveLength(9);
  });
  it('stores credentials under the config dir', () => {
    expect(CREDENTIALS_PATH).toMatch(/mobbin-axi[/\\]credentials\.json$/);
  });
});
