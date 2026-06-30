import { describe, it, expect } from 'vitest';
import { MCP_URL, TOOLS, CREDENTIALS_PATH } from '../src/config.js';

describe('config', () => {
  it('points at the Mobbin MCP', () => {
    expect(MCP_URL).toBe('https://api.mobbin.com/mcp');
  });
  it('lists exactly the 3 real MCP tools', () => {
    expect(Object.values(TOOLS)).toContain('search_screens');
    expect(Object.values(TOOLS)).toHaveLength(3);
  });
  it('stores credentials under the config dir', () => {
    expect(CREDENTIALS_PATH).toMatch(/mobbin-axi[/\\]credentials\.json$/);
  });
});
