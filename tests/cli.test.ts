import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

beforeEach(() => {
  vi.resetModules();
  process.env.MOBBIN_CONFIG_DIR = mkdtempSync(join(tmpdir(), 'mobbin-cli-'));
  process.exitCode = undefined;
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
    it(
      'logout --help shows help text and does NOT clear credentials',
      { timeout: 15000 },
      async () => {
        const credPath = join(process.env.MOBBIN_CONFIG_DIR!, 'credentials.json');
        mkdirSync(process.env.MOBBIN_CONFIG_DIR!, { recursive: true });
        writeFileSync(credPath, JSON.stringify({ tokens: { access_token: 'test-dummy' } }), {
          mode: 0o600,
        });

        const chunks: string[] = [];
        const stdout = { write: (s: string) => (chunks.push(s), true) } as any;
        const { main } = await import('../src/cli.js');
        await main({ argv: ['logout', '--help'], stdout });

        const output = chunks.join('');
        expect(output).toMatch(/logout/i);
        expect(output).not.toMatch(/Logged out/i);
        expect(existsSync(credPath)).toBe(true);
        expect(readFileSync(credPath, 'utf-8')).toContain('access_token');
      },
    );

    it(
      'screens --help shows help text and does not invoke auth/handler',
      { timeout: 15000 },
      async () => {
        const chunks: string[] = [];
        const stdout = { write: (s: string) => (chunks.push(s), true) } as any;
        const { main } = await import('../src/cli.js');
        await main({ argv: ['screens', '--help'], stdout });

        const output = chunks.join('');
        expect(output).toMatch(/screens/i);
        expect(output).not.toMatch(/AUTH_REQUIRED/i);
        expect(output).not.toMatch(/Not authenticated/i);
      },
    );

    it('login --help shows help text and does not open browser', { timeout: 15000 }, async () => {
      const chunks: string[] = [];
      const stdout = { write: (s: string) => (chunks.push(s), true) } as any;
      const { main } = await import('../src/cli.js');
      await main({ argv: ['login', '--help'], stdout });

      const output = chunks.join('');
      expect(output).toMatch(/login/i);
      expect(output).not.toMatch(/AUTH_REQUIRED/i);
      expect(output).not.toMatch(/opening/i);
    });
  });

  describe('help command', () => {
    it('--help documents the help command', { timeout: 15000 }, async () => {
      const chunks: string[] = [];
      const stdout = { write: (s: string) => (chunks.push(s), true) } as any;
      const { main } = await import('../src/cli.js');
      await main({ argv: ['--help'], stdout });

      expect(chunks.join('')).toMatch(/help \[command\]/i);
    });

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

  describe('argument validation', () => {
    it('rejects unknown logout flags before clearing credentials', { timeout: 15000 }, async () => {
      const credPath = join(process.env.MOBBIN_CONFIG_DIR!, 'credentials.json');
      mkdirSync(process.env.MOBBIN_CONFIG_DIR!, { recursive: true });
      writeFileSync(credPath, JSON.stringify({ tokens: { access_token: 'test-dummy' } }), {
        mode: 0o600,
      });

      const chunks: string[] = [];
      const stdout = { write: (s: string) => (chunks.push(s), true) } as any;
      const { main } = await import('../src/cli.js');
      await main({ argv: ['logout', '--typo'], stdout });

      expect(chunks.join('')).toMatch(/VALIDATION_ERROR/i);
      expect(process.exitCode).toBe(2);
      expect(readFileSync(credPath, 'utf-8')).toContain('access_token');
    });

    it.each([
      ['login', '--typo'],
      ['auth', 'status', '--typo'],
      ['help', '--typo'],
    ])('rejects invalid arguments for %s', { timeout: 15000 }, async (...argv: string[]) => {
      const chunks: string[] = [];
      const stdout = { write: (s: string) => (chunks.push(s), true) } as any;
      const { main } = await import('../src/cli.js');
      await main({ argv, stdout });

      expect(chunks.join('')).toMatch(/VALIDATION_ERROR/i);
      expect(process.exitCode).toBe(2);
    });
  });
});
