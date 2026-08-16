import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, statSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'mobbin-'));
  process.env.MOBBIN_CONFIG_DIR = dir;
});

describe('credential store', () => {
  it('round-trips tokens and writes a 0600 file', async () => {
    const { saveCredentials, loadCredentials } = await import(
      '../../src/auth/store.js?u=' + Date.now()
    );
    saveCredentials({
      tokens: { access_token: 'a', token_type: 'Bearer' } as any,
    });
    expect(loadCredentials()?.tokens?.access_token).toBe('a');
    // Windows does not enforce Unix file permissions — chmod(0600) is a no-op
    if (process.platform !== 'win32') {
      const mode = statSync(join(dir, 'credentials.json')).mode & 0o777;
      expect(mode).toBe(0o600);
    }
  });
  it('clear removes the file', async () => {
    const { saveCredentials, clearCredentials } = await import(
      '../../src/auth/store.js?u=' + Date.now()
    );
    saveCredentials({
      tokens: { access_token: 'a', token_type: 'Bearer' } as any,
    });
    clearCredentials();
    expect(existsSync(join(dir, 'credentials.json'))).toBe(false);
  });
});
