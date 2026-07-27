import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
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

  describe('--help on subcommands', () => {
    it('logout --help shows help text and does NOT clear credentials', { timeout: 15000 }, async () => {
      const credPath = join(process.env.MOBBIN_CONFIG_DIR!, 'credentials.json');
      mkdirSync(process.env.MOBBIN_CONFIG_DIR!, { recursive: true });
      writeFileSync(credPath, JSON.stringify({ tokens: { access_token: 'test-dummy' } }), { mode: 0o600 });

      const chunks: string[] = [];
      const stdout = { write: (s: string) => (chunks.push(s), true) } as any;
      const { main } = await import('../src/cli.js');
      await main({ argv: ['logout', '--help'], stdout });

      const output = chunks.join('');
      expect(output).toMatch(/logout/i);
      expect(output).not.toMatch(/Logged out/i);
      expect(existsSync(credPath)).toBe(true);
      expect(readFileSync(credPath, 'utf-8')).toContain('access_token');
    });

    it('screens --help shows help text and does not invoke auth/handler', { timeout: 15000 }, async () => {
      const chunks: string[] = [];
      const stdout = { write: (s: string) => (chunks.push(s), true) } as any;
      const { main } = await import('../src/cli.js');
      await main({ argv: ['screens', '--help'], stdout });

      const output = chunks.join('');
      expect(output).toMatch(/screens/i);
      // Should not have triggered auth
      expect(output).not.toMatch(/AUTH_REQUIRED/i);
      expect(output).not.toMatch(/Not authenticated/i);
    });

    it('login --help shows help text and does not open browser', { timeout: 15000 }, async () => {
      const chunks: string[] = [];
      const stdout = { write: (s: string) => (chunks.push(s), true) } as any;
      const { main } = await import('../src/cli.js');
      await main({ argv: ['login', '--help'], stdout });

      const output = chunks.join('');
      expect(output).toMatch(/login/i);
      // Should not have triggered the handler (browser, etc.)
      expect(output).not.toMatch(/AUTH_REQUIRED/i);
      expect(output).not.toMatch(/opening/i);
    });
  });

  describe('help command', () => {
    it('help (no args) shows top-level usage', { timeout: 15000 }, async () => {
      const chunks: string[] = [];
      const stdout = { write: (s: string) => (chunks.push(s), true) } as any;
      const { main } = await import('../src/cli.js');
      await main({ argv: ['help'], stdout });

      const output = chunks.join('');
      expect(output).toMatch(/usage/i);
    });

    it('help screens shows screens help', { timeout: 15000 }, async () => {
      const chunks: string[] = [];
      const stdout = { write: (s: string) => (chunks.push(s), true) } as any;
      const { main } = await import('../src/cli.js');
      await main({ argv: ['help', 'screens'], stdout });

      const output = chunks.join('');
      expect(output).toMatch(/screens/i);
      expect(output).toMatch(/usage/i);
    });
  });
});
