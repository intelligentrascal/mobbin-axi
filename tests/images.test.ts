import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mkdtempSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

beforeEach(() => {
  process.env.MOBBIN_CACHE_DIR = mkdtempSync(join(tmpdir(), 'mobbin-img-'));
});

async function freshDownloadImages() {
  const mod = await import('../src/images.js?u=' + Date.now());
  return mod.downloadImages;
}

describe('downloadImages', () => {
  it('writes one file per url and dedups', async () => {
    const downloadImages = await freshDownloadImages();
    const fake = async () =>
      ({ ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer }) as any;
    const paths = await downloadImages(['http://x/a.png', 'http://x/a.png'], fake);
    expect(paths).toHaveLength(1);
    expect(existsSync(paths[0])).toBe(true);
  });

  it('skips failed fetches (ok=false) and writes stderr warning, returning only successful paths', async () => {
    const downloadImages = await freshDownloadImages();
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    try {
      let fetchCalls = 0;
      const fake = async (url: string) => {
        fetchCalls++;
        if (url === 'http://x/bad.png') {
          return { ok: false, status: 404 } as any;
        }
        return { ok: true, arrayBuffer: async () => new Uint8Array([4, 5, 6]).buffer } as any;
      };
      const paths = await downloadImages(['http://x/good.png', 'http://x/bad.png'], fake);
      expect(paths).toHaveLength(1);
      expect(existsSync(paths[0])).toBe(true);
      expect(paths[0]).toMatch(/\.png$/);
      expect(fetchCalls).toBe(2);
      const stderrOutput = stderrSpy.mock.calls.map(c => c[0]).join('');
      expect(stderrOutput).toContain('mobbin-axi: image fetch failed');
      expect(stderrOutput).toContain('404');
      expect(stderrOutput).toContain('bad.png');
    } finally {
      stderrSpy.mockRestore();
    }
  });

  it('does not re-fetch when file already cached (cache hit)', async () => {
    const downloadImages = await freshDownloadImages();
    const fakeGood = async () =>
      ({ ok: true, arrayBuffer: async () => new Uint8Array([7, 8, 9]).buffer }) as any;

    // First call — should fetch and cache.
    const paths1 = await downloadImages(['http://x/cached.png'], fakeGood);
    expect(paths1).toHaveLength(1);
    expect(existsSync(paths1[0])).toBe(true);

    // Create a counting fetch that tracks calls.
    let fetchCount = 0;
    const countingFetch = async () => {
      fetchCount++;
      return { ok: true, arrayBuffer: async () => new Uint8Array([0]).buffer } as any;
    };

    // Second call with same URL — should not fetch because file exists.
    const paths2 = await downloadImages(['http://x/cached.png'], countingFetch);
    expect(paths2).toHaveLength(1);
    expect(fetchCount).toBe(0);
  });
});
