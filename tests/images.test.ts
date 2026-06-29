import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

beforeEach(() => {
  process.env.MOBBIN_CACHE_DIR = mkdtempSync(join(tmpdir(), 'mobbin-img-'));
});

describe('downloadImages', () => {
  it('writes one file per url and dedups', async () => {
    const { downloadImages } = await import('../src/images.js?u=' + Date.now());
    const fake = async () =>
      ({ ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer }) as any;
    const paths = await downloadImages(['http://x/a.png', 'http://x/a.png'], fake);
    expect(paths).toHaveLength(1);
    expect(existsSync(paths[0])).toBe(true);
  });
});
