import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

beforeEach(() => {
  vi.resetModules();
  process.env.MOBBIN_CONFIG_DIR = mkdtempSync(join(tmpdir(), 'mobbin-cli-'));
});

describe('cli', () => {
  it('auth status reports not authenticated when no creds', { timeout: 15000 }, async () => {
    const chunks: string[] = [];
    const stdout = { write: (s: string) => (chunks.push(s), true) } as any;
    const { main } = await import('../src/cli.js');
    await main({ argv: ['auth', 'status'], stdout });
    expect(chunks.join('')).toMatch(/not authenticated|false/i);
  });
});
