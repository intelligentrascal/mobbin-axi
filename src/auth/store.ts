import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
  existsSync,
  chmodSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import type { OAuthTokens } from '@modelcontextprotocol/sdk/shared/auth.js';
import { CONFIG_DIR, CREDENTIALS_PATH } from '../config.js';

export interface StoredCreds {
  tokens?: OAuthTokens;
  clientByIssuer?: Record<string, unknown>;
}

function path(): string {
  const override = process.env.MOBBIN_CONFIG_DIR;
  return override ? join(override, 'credentials.json') : CREDENTIALS_PATH;
}

export function loadCredentials(): StoredCreds | undefined {
  const p = path();
  if (!existsSync(p)) return undefined;
  try {
    return JSON.parse(readFileSync(p, 'utf-8')) as StoredCreds;
  } catch {
    return undefined;
  }
}

export function saveCredentials(creds: StoredCreds): void {
  const p = path();
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(creds, null, 2), { mode: 0o600 });
  chmodSync(p, 0o600);
}

export function clearCredentials(): void {
  const p = path();
  if (existsSync(p)) rmSync(p);
}
