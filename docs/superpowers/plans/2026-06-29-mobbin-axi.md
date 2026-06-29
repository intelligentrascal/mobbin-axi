# mobbin-axi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish `mobbin-axi`, an AXI-compliant CLI that wraps Mobbin's OAuth-gated hosted MCP and exposes its tools as token-efficient, content-first commands for agents.

**Architecture:** A TypeScript ESM CLI built on `axi-sdk-js` (`runAxiCli`). An internal MCP client (`@modelcontextprotocol/sdk` `Client` + `StreamableHTTPClientTransport`) is the only code that speaks MCP; a self-contained OAuth subsystem (`OAuthClientProvider` + disk-persisted tokens + a `login` loopback flow) authenticates to `https://api.mobbin.com/mcp`. Tool results are reshaped into TOON via vendored format helpers (minimal schemas, aggregates, truncation, suggestions). A lazy image module downloads public Supabase screenshots on `--download`.

**Tech Stack:** TypeScript (ESM), Node ≥20, `axi-sdk-js`, `@modelcontextprotocol/sdk`, `@toon-format/toon`, `open`, `vitest`, `eslint`, `prettier`, `tsc`.

## Global Constraints

- Node `>=20`; package is ESM (`"type": "module"`).
- MCP endpoint: `https://api.mobbin.com/mcp` (transport: Streamable HTTP).
- The 9 wrapped MCP tools: `mobbin_quick_search`, `mobbin_search_apps`, `mobbin_search_screens`, `mobbin_search_flows`, `mobbin_get_app_screens`, `mobbin_get_app_flows`, `mobbin_get_screen_detail`, `mobbin_get_filters`, `mobbin_popular_apps`.
- Auth is **OAuth only**. No `MOBBIN_TOKEN` paste path; no reading opencode's token.
- Credentials persist at `~/.config/mobbin-axi/credentials.json`, file mode `0600`.
- Image cache at `~/.cache/mobbin-axi/images/`. Images are public Supabase URLs; `--download` fetches them with **no auth**.
- Read-only tool: no mutation commands.
- Output: TOON-encoded; 3–4 fields per list item by default; content truncation with `--full`; pre-computed aggregates; definitive empty states ("0 results"); contextual next-step suggestions; `--json` raw escape hatch.
- Global flags: `--platform ios|android|web`, `--limit N`, `--full`, `--json`, `--download`.
- Distribution: npm package `mobbin-axi`; bundled Agent Skill; `setup hooks`.
- Never interactive in normal commands; only `login` opens a browser.

---

## File Structure

```
Projects/mobbin-axi/
  package.json
  tsconfig.json
  vitest.config.ts
  eslint.config.mjs
  .prettierrc
  README.md
  bin/mobbin-axi.ts                 # entry → main()
  src/
    cli.ts                          # runAxiCli wiring, global flags, help
    config.ts                       # constants: MCP_URL, tool names, paths
    globalFlags.ts                  # parse --platform/--limit/--full/--json/--download
    errors.ts                       # AxiError re-export + mapMcpError
    auth/
      store.ts                      # credentials.json read/write (mode 600)
      provider.ts                   # OAuthClientProvider impl (disk-backed)
      login.ts                      # login/logout/status + loopback server
    mcp/
      client.ts                     # getClient(), callTool()
    format/
      toon.ts                       # field/pluck/renderList/renderDetail/...
      truncate.ts                   # truncate(text, max) + --full
    tools/
      search.ts apps.ts screens.ts flows.ts app.ts screen.ts filters.ts
    suggestions.ts                  # contextual next-step table
    images.ts                       # --download cache
    context.ts                      # home/dashboard view
    commands/
      setup.ts                      # setup hooks
  skills/mobbin-axi/SKILL.md        # bundled Agent Skill
  tests/                            # mirrors src/ (vitest)
  docs/findings/                    # spike outputs (committed)
```

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `eslint.config.mjs`, `.prettierrc`, `bin/mobbin-axi.ts`, `src/config.ts`, `tests/config.test.ts`

**Interfaces:**
- Produces: `src/config.ts` exports `MCP_URL: string`, `TOOLS` (object of the 9 tool-name constants), `CONFIG_DIR`, `CACHE_DIR`, `CREDENTIALS_PATH`.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "mobbin-axi",
  "version": "0.1.0",
  "description": "AXI-compliant Mobbin CLI for agents — token-efficient TOON output over Mobbin's MCP",
  "type": "module",
  "bin": { "mobbin-axi": "./dist/bin/mobbin-axi.js" },
  "files": ["dist", "skills/mobbin-axi", "README.md"],
  "engines": { "node": ">=20" },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest",
    "dev": "tsx bin/mobbin-axi.ts",
    "lint": "eslint .",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.29.0",
    "@toon-format/toon": "^2.1.0",
    "axi-sdk-js": "^0.1.8",
    "open": "^10.1.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.4.0",
    "tsx": "^4.0.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  },
  "license": "MIT"
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": ".",
    "strict": true,
    "declaration": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["bin", "src"]
}
```

- [ ] **Step 3: Write `vitest.config.ts`, `.prettierrc`, `eslint.config.mjs`**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['tests/**/*.test.ts'] } });
```
```json
// .prettierrc
{ "singleQuote": true, "semi": true, "printWidth": 100 }
```
```js
// eslint.config.mjs
import js from '@eslint/js';
export default [js.configs.recommended, { languageOptions: { ecmaVersion: 2022, sourceType: 'module' } }];
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`
Expected: completes; `node_modules/@modelcontextprotocol/sdk` and `node_modules/axi-sdk-js` exist.

- [ ] **Step 5: Write the failing test for config constants**

```ts
// tests/config.test.ts
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
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run tests/config.test.ts`
Expected: FAIL — cannot find module `../src/config.js`.

- [ ] **Step 7: Implement `src/config.ts`**

```ts
import { homedir } from 'node:os';
import { join } from 'node:path';

export const MCP_URL = 'https://api.mobbin.com/mcp';

export const TOOLS = {
  quickSearch: 'mobbin_quick_search',
  searchApps: 'mobbin_search_apps',
  searchScreens: 'mobbin_search_screens',
  searchFlows: 'mobbin_search_flows',
  getAppScreens: 'mobbin_get_app_screens',
  getAppFlows: 'mobbin_get_app_flows',
  getScreenDetail: 'mobbin_get_screen_detail',
  getFilters: 'mobbin_get_filters',
  popularApps: 'mobbin_popular_apps',
} as const;

export const CONFIG_DIR = join(homedir(), '.config', 'mobbin-axi');
export const CACHE_DIR = join(homedir(), '.cache', 'mobbin-axi', 'images');
export const CREDENTIALS_PATH = join(CONFIG_DIR, 'credentials.json');
```

- [ ] **Step 8: Write `bin/mobbin-axi.ts` stub**

```ts
#!/usr/bin/env node
import { main } from '../src/cli.js';
main();
```

- [ ] **Step 9: Add a temporary `src/cli.ts` stub so build passes**

```ts
export async function main(): Promise<void> {
  process.stdout.write('mobbin-axi (scaffold)\n');
}
```

- [ ] **Step 10: Run tests + build**

Run: `npx vitest run && npm run build`
Expected: tests PASS; `dist/bin/mobbin-axi.js` produced.

- [ ] **Step 11: Commit**

```bash
git add -A && git commit -m "chore: scaffold mobbin-axi project"
```

---

### Task 2: OAuth + tool-schema spike (gating)

This is a **spike**, not TDD. Its deliverable is committed findings that later tasks depend on. Do this before building the auth subsystem.

**Files:**
- Create: `scripts/spike-oauth.ts`, `docs/findings/oauth-spike.md`, `docs/findings/tools.md`

**Interfaces:**
- Produces: documented values used by Tasks 5–8 — the OAuth authorization-server base URL and whether the SDK auto-discovers it, plus each tool's input arg names and result JSON shape.

- [ ] **Step 1: Probe the protected-resource + auth-server metadata**

Run:
```bash
curl -sS -i -X POST https://api.mobbin.com/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  --data '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"spike","version":"0"}}}'
curl -sS -H 'Accept: application/json' https://api.mobbin.com/.well-known/oauth-protected-resource/mcp
curl -sS -H 'Accept: application/json' https://api.mobbin.com/.well-known/oauth-authorization-server
```
Record in `docs/findings/oauth-spike.md`: the `WWW-Authenticate` resource_metadata URL, whether each `.well-known` returns JSON or a 404/HTML page, and (if found) `authorization_endpoint`, `token_endpoint`, `registration_endpoint`, `scopes_supported`.

- [ ] **Step 2: Attempt the real SDK OAuth flow**

Write `scripts/spike-oauth.ts` that builds an `InMemoryOAuthClientProvider`-style provider (redirect `http://localhost:8765/callback`, `application_type: 'native'`), a `StreamableHTTPClientTransport(new URL(MCP_URL), { authProvider })`, calls `client.connect`, catches `UnauthorizedError`, opens the browser, runs a one-shot loopback server on 8765, calls `transport.finishAuth(params)`, reconnects, then calls `client.listTools()`.

Run: `npx tsx scripts/spike-oauth.ts`
Record in `oauth-spike.md`: did the SDK's automatic discovery succeed against Mobbin, or did `connect` throw a discovery error? If discovery failed, record the exact override needed (e.g. seeding `saveDiscoveryState` / passing the auth-server URL) and the working endpoint values. **This answers the gating risk.**

- [ ] **Step 3: Capture tool schemas + sample results**

In the same script, after auth, call `client.listTools()` and one representative `client.callTool` per tool (e.g. `mobbin_quick_search {query:"login"}`, `mobbin_popular_apps {}`). Dump results.
Record in `docs/findings/tools.md`: each tool's exact input property names and the JSON shape of results (field names for app id/name/tagline/logo, screen id/url/pattern, flow id/name, image URL fields). Save 2–3 sanitized JSON samples into `tests/fixtures/` for formatter tests.

- [ ] **Step 4: Commit findings**

```bash
git add docs/findings tests/fixtures scripts/spike-oauth.ts
git commit -m "docs: oauth + tool-schema spike findings"
```

> If Step 2 shows Mobbin's OAuth cannot be driven headlessly even with overrides, STOP and report — the OAuth-only decision must be revisited before continuing.

---

### Task 3: Credential store

**Files:**
- Create: `src/auth/store.ts`, `tests/auth/store.test.ts`

**Interfaces:**
- Produces: `loadCredentials(): StoredCreds | undefined`, `saveCredentials(c: StoredCreds): void`, `clearCredentials(): void`, and type `StoredCreds = { tokens?: OAuthTokens; clientByIssuer?: Record<string, unknown> }` where `OAuthTokens` is imported from `@modelcontextprotocol/sdk/shared/auth.js`.

- [ ] **Step 1: Write the failing test (use a temp HOME)**

```ts
// tests/auth/store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, statSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let dir: string;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'mobbin-')); process.env.MOBBIN_CONFIG_DIR = dir; });

describe('credential store', () => {
  it('round-trips tokens and writes a 0600 file', async () => {
    const { saveCredentials, loadCredentials } = await import('../../src/auth/store.js?u=' + Date.now());
    saveCredentials({ tokens: { access_token: 'a', token_type: 'Bearer' } as any });
    expect(loadCredentials()?.tokens?.access_token).toBe('a');
    const mode = statSync(join(dir, 'credentials.json')).mode & 0o777;
    expect(mode).toBe(0o600);
  });
  it('clear removes the file', async () => {
    const { saveCredentials, clearCredentials } = await import('../../src/auth/store.js?u=' + Date.now());
    saveCredentials({ tokens: { access_token: 'a', token_type: 'Bearer' } as any });
    clearCredentials();
    expect(existsSync(join(dir, 'credentials.json'))).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/auth/store.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/auth/store.ts`**

```ts
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync, chmodSync } from 'node:fs';
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
  try { return JSON.parse(readFileSync(p, 'utf-8')) as StoredCreds; } catch { return undefined; }
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
```

(`process.env.MOBBIN_CONFIG_DIR` is honored so tests and the real `CONFIG_DIR` share one code path.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/auth/store.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/auth/store.ts tests/auth/store.test.ts && git commit -m "feat: disk-backed credential store"
```

---

### Task 4: OAuth client provider

**Files:**
- Create: `src/auth/provider.ts`, `tests/auth/provider.test.ts`

**Interfaces:**
- Consumes: `store.ts` (`loadCredentials`/`saveCredentials`).
- Produces: `class MobbinOAuthProvider implements OAuthClientProvider` with a constructor `(onRedirect: (url: URL) => void)`; persists `tokens` and client info via the store; keeps verifier/discovery/lastState in memory for one process.

- [ ] **Step 1: Write the failing test**

```ts
// tests/auth/provider.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

beforeEach(() => { process.env.MOBBIN_CONFIG_DIR = mkdtempSync(join(tmpdir(), 'mobbin-')); });

describe('MobbinOAuthProvider', () => {
  it('persists tokens through the store and round-trips the verifier', async () => {
    const { MobbinOAuthProvider } = await import('../../src/auth/provider.js?u=' + Date.now());
    const p = new MobbinOAuthProvider(() => {});
    p.saveCodeVerifier('v123');
    expect(p.codeVerifier()).toBe('v123');
    p.saveTokens({ access_token: 'tok', token_type: 'Bearer' } as any);
    const p2 = new MobbinOAuthProvider(() => {});
    expect(p2.tokens()?.access_token).toBe('tok');
  });
  it('produces a random state and exposes it as lastState', async () => {
    const { MobbinOAuthProvider } = await import('../../src/auth/provider.js?u=' + Date.now());
    const p = new MobbinOAuthProvider(() => {});
    const s = p.state();
    expect(s).toEqual(p.lastState);
    expect(s.length).toBeGreaterThan(10);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/auth/provider.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/auth/provider.ts`**

```ts
import { randomUUID } from 'node:crypto';
import type {
  OAuthClientProvider,
  OAuthClientInformationContext,
} from '@modelcontextprotocol/sdk/client/auth.js';
import type {
  OAuthClientMetadata,
  OAuthClientInformationMixed,
  OAuthTokens,
  OAuthDiscoveryState,
} from '@modelcontextprotocol/sdk/shared/auth.js';
import { loadCredentials, saveCredentials } from './store.js';

export const REDIRECT_PORT = 8765;
export const REDIRECT_URL = `http://localhost:${REDIRECT_PORT}/callback`;

export class MobbinOAuthProvider implements OAuthClientProvider {
  lastState?: string;
  private verifier?: string;
  private discovery?: OAuthDiscoveryState;

  constructor(private readonly onRedirect: (url: URL) => void) {}

  readonly redirectUrl = REDIRECT_URL;
  readonly clientMetadata: OAuthClientMetadata = {
    client_name: 'mobbin-axi',
    redirect_uris: [REDIRECT_URL],
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    application_type: 'native',
  };

  clientInformation(ctx?: OAuthClientInformationContext): OAuthClientInformationMixed | undefined {
    const byIssuer = loadCredentials()?.clientByIssuer;
    if (!ctx || !byIssuer) return undefined;
    return byIssuer[ctx.issuer] as OAuthClientInformationMixed | undefined;
  }
  saveClientInformation(info: OAuthClientInformationMixed, ctx?: OAuthClientInformationContext): void {
    if (!ctx) return;
    const creds = loadCredentials() ?? {};
    creds.clientByIssuer = { ...(creds.clientByIssuer ?? {}), [ctx.issuer]: info };
    saveCredentials(creds);
  }
  tokens(): OAuthTokens | undefined {
    return loadCredentials()?.tokens;
  }
  saveTokens(tokens: OAuthTokens): void {
    const creds = loadCredentials() ?? {};
    creds.tokens = tokens;
    saveCredentials(creds);
  }
  state(): string {
    this.lastState = randomUUID();
    return this.lastState;
  }
  saveDiscoveryState(state: OAuthDiscoveryState): void { this.discovery = state; }
  discoveryState(): OAuthDiscoveryState | undefined { return this.discovery; }
  redirectToAuthorization(url: URL): void { this.onRedirect(url); }
  saveCodeVerifier(v: string): void { this.verifier = v; }
  codeVerifier(): string {
    if (!this.verifier) throw new Error('no code verifier');
    return this.verifier;
  }
}
```

> If Task 2 found the SDK cannot auto-discover Mobbin's auth server, add the override exactly as recorded in `oauth-spike.md` (e.g. pre-seed `this.discovery` in the constructor or pass the auth-server URL to the transport). Import paths above may need adjustment to match the installed SDK version — verify against `node_modules/@modelcontextprotocol/sdk` during the spike.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/auth/provider.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/auth/provider.ts tests/auth/provider.test.ts && git commit -m "feat: OAuth client provider"
```

---

### Task 5: Login / logout / status

**Files:**
- Create: `src/auth/login.ts`, `tests/auth/login.test.ts`

**Interfaces:**
- Consumes: `provider.ts`, `mcp/client.ts` (Task 6 — `connectAuthenticated`). To avoid a cycle, login owns the connect flow directly and exports `runLogin(): Promise<void>`, `runLogout(): void`, `authStatus(): { authenticated: boolean }`, and a testable helper `waitForCallback(server, expectedState): Promise<URLSearchParams>`.

- [ ] **Step 1: Write the failing test for the callback helper**

```ts
// tests/auth/login.test.ts
import { describe, it, expect } from 'vitest';
import { parseCallback } from '../../src/auth/login.js';

describe('parseCallback', () => {
  it('returns params when state matches', () => {
    const url = 'http://localhost:8765/callback?code=abc&state=s1';
    expect(parseCallback(url, 's1').get('code')).toBe('abc');
  });
  it('throws on state mismatch', () => {
    const url = 'http://localhost:8765/callback?code=abc&state=evil';
    expect(() => parseCallback(url, 's1')).toThrow(/state/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/auth/login.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/auth/login.ts`**

```ts
import { createServer } from 'node:http';
import open from 'open';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { UnauthorizedError } from '@modelcontextprotocol/sdk/client/auth.js';
import { MCP_URL } from '../config.js';
import { MobbinOAuthProvider, REDIRECT_PORT } from './provider.js';
import { loadCredentials, clearCredentials } from './store.js';

export function parseCallback(callbackUrl: string, expectedState: string): URLSearchParams {
  const params = new URL(callbackUrl).searchParams;
  if (params.get('state') !== expectedState) throw new Error('state mismatch');
  return params;
}

function waitForCallback(provider: MobbinOAuthProvider): Promise<URLSearchParams> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      if (!req.url?.startsWith('/callback')) { res.writeHead(404).end(); return; }
      try {
        const params = parseCallback(`http://localhost:${REDIRECT_PORT}${req.url}`, provider.lastState ?? '');
        res.writeHead(200, { 'content-type': 'text/html' }).end('<p>mobbin-axi: you can close this tab.</p>');
        server.close();
        resolve(params);
      } catch (e) {
        res.writeHead(400).end('state mismatch');
        server.close();
        reject(e);
      }
    });
    server.listen(REDIRECT_PORT);
    server.on('error', reject);
  });
}

export async function runLogin(): Promise<void> {
  const provider = new MobbinOAuthProvider((url) => void open(url.toString()));
  const client = new Client({ name: 'mobbin-axi', version: '0.1.0' });
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(MCP_URL), { authProvider: provider }));
    process.stdout.write('Already authenticated.\n');
    return;
  } catch (error) {
    const root = error instanceof UnauthorizedError
      ? error
      : (error as { data?: { cause?: unknown } }).data?.cause;
    if (!(root instanceof UnauthorizedError)) throw error;
  }
  const params = await waitForCallback(provider);
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), { authProvider: provider });
  await transport.finishAuth(params);
  await new Client({ name: 'mobbin-axi', version: '0.1.0' })
    .connect(new StreamableHTTPClientTransport(new URL(MCP_URL), { authProvider: provider }));
  process.stdout.write('Login successful.\n');
}

export function runLogout(): void { clearCredentials(); process.stdout.write('Logged out.\n'); }
export function authStatus(): { authenticated: boolean } {
  return { authenticated: Boolean(loadCredentials()?.tokens?.access_token) };
}
```

> Verify `UnauthorizedError`, `finishAuth`, and transport import paths against the installed SDK during the spike; adjust if the version differs.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/auth/login.test.ts`
Expected: PASS.

- [ ] **Step 5: Manual live verification**

Run: `npx tsx bin/mobbin-axi.ts login` (after Task 11 wires the command) or `npx tsx -e "import('./src/auth/login.js').then(m=>m.runLogin())"`.
Expected: browser opens, you approve, terminal prints "Login successful.", `~/.config/mobbin-axi/credentials.json` exists.

- [ ] **Step 6: Commit**

```bash
git add src/auth/login.ts tests/auth/login.test.ts && git commit -m "feat: oauth login/logout/status"
```

---

### Task 6: MCP client

**Files:**
- Create: `src/mcp/client.ts`, `src/errors.ts`, `tests/mcp/client.test.ts`

**Interfaces:**
- Consumes: `provider.ts`, `config.ts`.
- Produces: `callTool(name: string, args: Record<string, unknown>): Promise<unknown>` — connects with stored tokens, calls the tool, returns the parsed structured result; throws `AxiError('Not authenticated', 'AUTH_REQUIRED', ['Run `mobbin-axi login`'])` on `UnauthorizedError`. Also `src/errors.ts` exports `AxiError`, `exitCodeForError` (re-exported from `axi-sdk-js`) and `mapMcpError(e): AxiError`.

- [ ] **Step 1: Write `src/errors.ts`**

```ts
import { AxiError, exitCodeForError } from 'axi-sdk-js';
export { AxiError, exitCodeForError };

export function mapMcpError(error: unknown): AxiError {
  const msg = error instanceof Error ? error.message : String(error);
  if (/unauthor/i.test(msg) || /401/.test(msg)) {
    return new AxiError('Not authenticated with Mobbin', 'AUTH_REQUIRED', ['Run `mobbin-axi login`']);
  }
  return new AxiError(msg || 'Mobbin MCP request failed', 'MCP_ERROR');
}
```

- [ ] **Step 2: Write the failing test for `mapMcpError`**

```ts
// tests/mcp/client.test.ts
import { describe, it, expect } from 'vitest';
import { mapMcpError } from '../../src/errors.js';

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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/mcp/client.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `src/mcp/client.ts`**

```ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { MCP_URL } from '../config.js';
import { MobbinOAuthProvider } from '../auth/provider.js';
import { loadCredentials } from '../auth/store.js';
import { AxiError, mapMcpError } from '../errors.js';

let cached: Client | undefined;

async function connect(): Promise<Client> {
  if (cached) return cached;
  if (!loadCredentials()?.tokens?.access_token) {
    throw new AxiError('Not authenticated with Mobbin', 'AUTH_REQUIRED', ['Run `mobbin-axi login`']);
  }
  const provider = new MobbinOAuthProvider(() => {
    throw new AxiError('Mobbin session expired', 'AUTH_REQUIRED', ['Run `mobbin-axi login`']);
  });
  const client = new Client({ name: 'mobbin-axi', version: '0.1.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(MCP_URL), { authProvider: provider }));
  cached = client;
  return client;
}

export async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  try {
    const client = await connect();
    const result = await client.callTool({ name, arguments: args });
    return (result as { structuredContent?: unknown }).structuredContent ?? parseTextContent(result);
  } catch (error) {
    if (error instanceof AxiError) throw error;
    throw mapMcpError(error);
  }
}

function parseTextContent(result: unknown): unknown {
  const content = (result as { content?: Array<{ type: string; text?: string }> }).content ?? [];
  const text = content.find((c) => c.type === 'text')?.text;
  if (!text) return result;
  try { return JSON.parse(text); } catch { return { text }; }
}
```

> The exact result accessor (`structuredContent` vs `content[].text`) is confirmed in Task 2's `tools.md`; keep both paths.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/mcp/client.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/mcp/client.ts src/errors.ts tests/mcp/client.test.ts && git commit -m "feat: MCP client + error mapping"
```

---

### Task 7: TOON format helpers + truncation

**Files:**
- Create: `src/format/toon.ts`, `src/format/truncate.ts`, `tests/format/toon.test.ts`

**Interfaces:**
- Produces: `field`, `pluck`, `custom` schema builders; `renderList(label, items, schema)`, `renderDetail(label, item, schema)`, `renderHelp(lines)`, `renderError(message, code, suggestions)`, `renderOutput(blocks)`; and `truncate(text, max, full)`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/format/toon.test.ts
import { describe, it, expect } from 'vitest';
import { field, pluck, renderList, renderHelp } from '../../src/format/toon.js';
import { truncate } from '../../src/format/truncate.js';

describe('toon helpers', () => {
  it('renders a labeled list with selected fields', () => {
    const out = renderList('apps', [{ id: '1', appName: 'Airbnb', extra: 'drop' }], [field('id'), field('appName', 'name')]);
    expect(out).toContain('apps');
    expect(out).toContain('Airbnb');
    expect(out).not.toContain('drop');
  });
  it('plucks nested values', () => {
    const out = renderList('x', [{ a: { b: 'v' } }], [pluck('a', 'b', 'name')]);
    expect(out).toContain('v');
  });
  it('renders help lines', () => {
    expect(renderHelp(['do x'])).toContain('help[1]');
  });
});

describe('truncate', () => {
  it('cuts long text and adds a hint unless full', () => {
    expect(truncate('abcdef', 3, false)).toMatch(/abc.*\+3/);
    expect(truncate('abcdef', 3, true)).toBe('abcdef');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/format/toon.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/format/toon.ts`** (port of gh-axi's helper, trimmed to what we use)

```ts
import { encode } from '@toon-format/toon';

type FieldDef =
  | { type: 'field'; key: string; as?: string }
  | { type: 'pluck'; key: string; subkey: string; as?: string }
  | { type: 'custom'; as: string; fn: (item: Record<string, unknown>) => unknown };

export const field = (key: string, as?: string): FieldDef => ({ type: 'field', key, as });
export const pluck = (key: string, subkey: string, as?: string): FieldDef => ({ type: 'pluck', key, subkey, as });
export const custom = (as: string, fn: (i: Record<string, unknown>) => unknown): FieldDef => ({ type: 'custom', as, fn });

function extract(item: Record<string, unknown>, schema: FieldDef[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const def of schema) {
    const key = def.as ?? ('key' in def ? def.key : def.as);
    if (def.type === 'field') out[key] = item[def.key] ?? null;
    else if (def.type === 'pluck') out[key] = (item[def.key] as Record<string, unknown>)?.[def.subkey] ?? null;
    else out[key] = def.fn(item);
  }
  return out;
}

export function renderList(label: string, items: Record<string, unknown>[], schema: FieldDef[]): string {
  return encode({ [label]: items.map((i) => extract(i, schema)) });
}
export function renderDetail(label: string, item: Record<string, unknown>, schema: FieldDef[]): string {
  return encode({ [label]: extract(item, schema) });
}
export function renderHelp(lines: string[]): string {
  if (lines.length === 0) return '';
  return `help[${lines.length}]:\n${lines.map((l) => `  ${l}`).join('\n')}`;
}
export function renderError(message: string, code: string, suggestions: string[] = []): string {
  const blocks = [encode({ error: message, code })];
  if (suggestions.length) blocks.push(renderHelp(suggestions));
  return blocks.join('\n');
}
export function renderOutput(blocks: string[]): string {
  return blocks.filter(Boolean).join('\n');
}
```

- [ ] **Step 4: Implement `src/format/truncate.ts`**

```ts
export function truncate(text: string, max: number, full: boolean): string {
  if (full || text.length <= max) return text;
  return `${text.slice(0, max)}… (+${text.length - max} chars, use --full)`;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/format/toon.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/format tests/format && git commit -m "feat: TOON format helpers + truncation"
```

---

### Task 8: Tool mappers + view models

One mapper per command. Each takes parsed args + global flags, calls `callTool`, and returns `{ blocks: string[]; ctx: SuggestionCtx }`. Use the exact field names recorded in `docs/findings/tools.md`; the schemas below use the field names observed in the spike (app: `id`, `appName`, `appTagline`, `appLogoUrl`; screen: `screenId`/`id`, `screenUrl`, `pattern`; flow: `id`, `name`) — adjust to match `tools.md` if they differ.

**Files:**
- Create: `src/tools/{search,apps,screens,flows,app,screen,filters}.ts`, `tests/tools/screens.test.ts`

**Interfaces:**
- Consumes: `callTool` (Task 6), TOON helpers (Task 7).
- Produces, for each module, an async handler `(args: string[], flags: GlobalFlags) => Promise<ToolResult>` where `ToolResult = { blocks: string[]; suggestion: SuggestionCtx }` and `SuggestionCtx = { domain: string; action: string; isEmpty: boolean; id?: string }`.

- [ ] **Step 1: Write the failing test for `screens` (pure mapping via injected caller)**

```ts
// tests/tools/screens.test.ts
import { describe, it, expect } from 'vitest';
import { mapScreens } from '../../src/tools/screens.js';

describe('mapScreens', () => {
  it('renders 3-4 fields and a count, with a definitive empty state', () => {
    const empty = mapScreens({ screens: [] }, { platform: undefined } as any);
    expect(empty.blocks.join('\n')).toMatch(/0 results/);
    const filled = mapScreens(
      { screens: [{ id: 's1', screenUrl: 'http://img/1.png', pattern: 'Login', appName: 'Airbnb' }] },
      { platform: undefined } as any,
    );
    expect(filled.blocks.join('\n')).toContain('Airbnb');
    expect(filled.blocks.join('\n')).toContain('1 result');
    expect(filled.suggestion.domain).toBe('screens');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/tools/screens.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/tools/screens.ts`** (separate pure `mapScreens` from the IO handler so it is unit-testable)

```ts
import { callTool } from '../mcp/client.js';
import { TOOLS } from '../config.js';
import { field, renderList, renderOutput } from '../format/toon.js';
import type { GlobalFlags } from '../globalFlags.js';

export interface ToolResult {
  blocks: string[];
  suggestion: { domain: string; action: string; isEmpty: boolean; id?: string };
}

export function mapScreens(result: { screens?: unknown[] }, _flags: GlobalFlags): ToolResult {
  const items = (result.screens ?? []) as Record<string, unknown>[];
  const count = items.length;
  const header = `${count} result${count === 1 ? '' : 's'}`;
  if (count === 0) {
    return { blocks: [header + ' (0 results)'], suggestion: { domain: 'screens', action: 'search', isEmpty: true } };
  }
  const list = renderList('screens', items, [
    field('id'),
    field('appName', 'app'),
    field('pattern'),
    field('screenUrl', 'image'),
  ]);
  return { blocks: [header, list], suggestion: { domain: 'screens', action: 'search', isEmpty: false } };
}

export async function screensCommand(args: string[], flags: GlobalFlags): Promise<string> {
  const query = args.join(' ');
  const mcpArgs: Record<string, unknown> = { query };
  if (flags.platform) mcpArgs.platform = flags.platform;
  if (flags.limit) mcpArgs.limit = flags.limit;
  const result = (await callTool(TOOLS.searchScreens, mcpArgs)) as { screens?: unknown[] };
  const mapped = mapScreens(result, flags);
  return renderOutput(mapped.blocks);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/tools/screens.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement the remaining mappers using the same pattern**

Create `apps.ts`, `flows.ts`, `search.ts`, `app.ts`, `screen.ts`, `filters.ts`. Each exposes a pure `mapX(result, flags)` plus an async `xCommand(args, flags)`. Schemas (adjust field names to `tools.md`):
- `apps` → `mobbin_search_apps` (or `mobbin_popular_apps` when `flags.popular`): `[field('id'), field('appName','name'), field('appTagline','tagline'), field('appLogoUrl','logo')]`, header `N results`.
- `flows` → `mobbin_search_flows`: `[field('id'), field('appName','app'), field('name','flow')]`.
- `search` → `mobbin_quick_search` (or the type-specific tool when `flags.type` is set): render whatever result groups come back, each as its own labeled list.
- `app <appId> screens|flows` → `mobbin_get_app_screens` / `mobbin_get_app_flows`, arg `{ appId }`.
- `screen <screenId>` → `mobbin_get_screen_detail` via `renderDetail('screen', result, [...])` including `field('screenUrl','image')`.
- `filters` → `mobbin_get_filters`, render the platform/category/pattern enum lists.

- [ ] **Step 6: Add tests for `apps` and `screen` mirroring Step 1, run all, commit**

Run: `npx vitest run tests/tools`
Expected: PASS.
```bash
git add src/tools tests/tools && git commit -m "feat: Mobbin tool mappers + view models"
```

---

### Task 9: Global flags parser

**Files:**
- Create: `src/globalFlags.ts`, `tests/globalFlags.test.ts`

**Interfaces:**
- Produces: `interface GlobalFlags { platform?: 'ios'|'android'|'web'; limit?: number; full: boolean; json: boolean; download: boolean; popular: boolean; type?: string }` and `parseGlobalFlags(args: string[]): { flags: GlobalFlags; rest: string[] }`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/globalFlags.test.ts
import { describe, it, expect } from 'vitest';
import { parseGlobalFlags } from '../src/globalFlags.js';

describe('parseGlobalFlags', () => {
  it('extracts known flags and leaves positional args', () => {
    const { flags, rest } = parseGlobalFlags(['Login', '--platform', 'ios', '--limit', '5', '--full', '--download']);
    expect(flags.platform).toBe('ios');
    expect(flags.limit).toBe(5);
    expect(flags.full).toBe(true);
    expect(flags.download).toBe(true);
    expect(rest).toEqual(['Login']);
  });
  it('accepts --platform=web equals form', () => {
    expect(parseGlobalFlags(['--platform=web']).flags.platform).toBe('web');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/globalFlags.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/globalFlags.ts`**

```ts
export interface GlobalFlags {
  platform?: 'ios' | 'android' | 'web';
  limit?: number;
  full: boolean;
  json: boolean;
  download: boolean;
  popular: boolean;
  type?: string;
}

export function parseGlobalFlags(args: string[]): { flags: GlobalFlags; rest: string[] } {
  const flags: GlobalFlags = { full: false, json: false, download: false, popular: false };
  const rest: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const eq = (p: string) => (a.startsWith(p + '=') ? a.slice(p.length + 1) : undefined);
    if (a === '--full') flags.full = true;
    else if (a === '--json') flags.json = true;
    else if (a === '--download') flags.download = true;
    else if (a === '--popular') flags.popular = true;
    else if (a === '--platform') flags.platform = args[++i] as GlobalFlags['platform'];
    else if (eq('--platform')) flags.platform = eq('--platform') as GlobalFlags['platform'];
    else if (a === '--limit') flags.limit = Number(args[++i]);
    else if (eq('--limit')) flags.limit = Number(eq('--limit'));
    else if (a === '--type') flags.type = args[++i];
    else if (eq('--type')) flags.type = eq('--type');
    else rest.push(a);
  }
  return { flags, rest };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/globalFlags.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/globalFlags.ts tests/globalFlags.test.ts && git commit -m "feat: global flag parsing"
```

---

### Task 10: Suggestions + image download

**Files:**
- Create: `src/suggestions.ts`, `src/images.ts`, `tests/suggestions.test.ts`, `tests/images.test.ts`

**Interfaces:**
- Produces: `getSuggestions(ctx: { domain: string; action: string; isEmpty: boolean; id?: string }): string[]`; and `downloadImages(urls: string[], fetchImpl?): Promise<string[]>` returning local cache paths.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/suggestions.test.ts
import { describe, it, expect } from 'vitest';
import { getSuggestions } from '../src/suggestions.js';
describe('getSuggestions', () => {
  it('suggests drilling into a screen after a screens search', () => {
    const lines = getSuggestions({ domain: 'screens', action: 'search', isEmpty: false });
    expect(lines.join('\n')).toMatch(/mobbin-axi screen/);
  });
  it('suggests broadening when empty', () => {
    expect(getSuggestions({ domain: 'screens', action: 'search', isEmpty: true }).length).toBeGreaterThan(0);
  });
});
```
```ts
// tests/images.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
beforeEach(() => { process.env.MOBBIN_CACHE_DIR = mkdtempSync(join(tmpdir(), 'mobbin-img-')); });
describe('downloadImages', () => {
  it('writes one file per url and dedups', async () => {
    const { downloadImages } = await import('../src/images.js?u=' + Date.now());
    const fake = async () => ({ ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer }) as any;
    const paths = await downloadImages(['http://x/a.png', 'http://x/a.png'], fake);
    expect(paths).toHaveLength(1);
    expect(existsSync(paths[0])).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/suggestions.test.ts tests/images.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `src/suggestions.ts`**

```ts
export interface SuggestionCtx { domain: string; action: string; isEmpty: boolean; id?: string }

const table: Array<{ match: (c: SuggestionCtx) => boolean; lines: (c: SuggestionCtx) => string[] }> = [
  { match: (c) => c.domain === 'home', lines: () => ['Run `mobbin-axi search "<query>"` or `mobbin-axi screens "Login"`'] },
  { match: (c) => c.domain === 'screens' && !c.isEmpty, lines: () => [
      'Run `mobbin-axi screen <id>` for full detail',
      'Add `--download` to fetch the screenshots as local files',
    ] },
  { match: (c) => c.domain === 'screens' && c.isEmpty, lines: () => [
      'Try a broader term or run `mobbin-axi filters` to see valid patterns',
    ] },
  { match: (c) => c.domain === 'apps' && !c.isEmpty, lines: () => ['Run `mobbin-axi app <appId> screens` to see an app\'s screens'] },
  { match: (c) => c.domain === 'flows' && !c.isEmpty, lines: () => ['Run `mobbin-axi screen <id>` to inspect a flow\'s screens'] },
  { match: (c) => c.domain === 'screen', lines: () => ['Add `--download` to fetch this screenshot locally'] },
];

export function getSuggestions(ctx: SuggestionCtx): string[] {
  for (const e of table) if (e.match(ctx)) return e.lines(ctx);
  return [];
}
```

- [ ] **Step 4: Implement `src/images.ts`**

```ts
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { CACHE_DIR } from './config.js';

function cacheDir(): string { return process.env.MOBBIN_CACHE_DIR ?? CACHE_DIR; }
type FetchLike = (url: string) => Promise<{ ok: boolean; arrayBuffer: () => Promise<ArrayBuffer> }>;

export async function downloadImages(urls: string[], fetchImpl: FetchLike = fetch): Promise<string[]> {
  const dir = cacheDir();
  mkdirSync(dir, { recursive: true });
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    if (seen.has(url)) continue;
    seen.add(url);
    const ext = extname(new URL(url).pathname) || '.png';
    const file = join(dir, createHash('sha1').update(url).digest('hex') + ext);
    if (!existsSync(file)) {
      const res = await fetchImpl(url);
      if (!res.ok) continue;
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    }
    out.push(file);
  }
  return out;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/suggestions.test.ts tests/images.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/suggestions.ts src/images.ts tests/suggestions.test.ts tests/images.test.ts && git commit -m "feat: suggestions + image download cache"
```

---

### Task 11: CLI router + home view + auth/setup commands

**Files:**
- Create: `src/context.ts`, `src/commands/setup.ts`; Modify: `src/cli.ts` (replace stub)
- Test: `tests/cli.test.ts`

**Interfaces:**
- Consumes: every command module, `parseGlobalFlags`, `getSuggestions`, `downloadImages`, `authStatus`/`runLogin`/`runLogout`, `exitCodeForError`.
- Produces: `main(options?: { argv?: string[]; stdout?: NodeJS.WritableStream }): Promise<void>` wired through `runAxiCli`.

- [ ] **Step 1: Write the failing test (login-required path)**

```ts
// tests/cli.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

beforeEach(() => { process.env.MOBBIN_CONFIG_DIR = mkdtempSync(join(tmpdir(), 'mobbin-cli-')); });

describe('cli', () => {
  it('auth status reports not authenticated when no creds', async () => {
    const chunks: string[] = [];
    const stdout = { write: (s: string) => (chunks.push(s), true) } as any;
    const { main } = await import('../src/cli.js?u=' + Date.now());
    await main({ argv: ['auth', 'status'], stdout });
    expect(chunks.join('')).toMatch(/not authenticated|false/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/cli.test.ts`
Expected: FAIL — `auth status` not handled by the stub.

- [ ] **Step 3: Implement `src/context.ts` (home view)**

```ts
import { callTool } from './mcp/client.js';
import { TOOLS } from './config.js';
import { field, renderList, renderHelp, renderOutput } from './format/toon.js';
import { authStatus } from './auth/login.js';
import { getSuggestions } from './suggestions.js';

export async function homeCommand(): Promise<string> {
  const status = authStatus();
  if (!status.authenticated) {
    return renderOutput([
      'mobbin-axi: not authenticated',
      renderHelp(['Run `mobbin-axi login` to authenticate with Mobbin']),
    ]);
  }
  let popular = '';
  try {
    const res = (await callTool(TOOLS.popularApps, {})) as { apps?: unknown[] };
    popular = renderList('popular_apps', (res.apps ?? []).slice(0, 5) as Record<string, unknown>[], [
      field('id'), field('appName', 'name'), field('appTagline', 'tagline'),
    ]);
  } catch { popular = ''; }
  return renderOutput([popular, renderHelp(getSuggestions({ domain: 'home', action: 'home', isEmpty: false }))]);
}
```

- [ ] **Step 4: Implement `src/commands/setup.ts`**

```ts
import { setupHooks } from 'axi-sdk-js';

export async function setupCommand(args: string[]): Promise<string> {
  if (args[0] !== 'hooks') return 'usage: mobbin-axi setup hooks';
  await setupHooks({ command: 'mobbin-axi', marker: 'mobbin-axi' });
  return 'Installed SessionStart hooks for mobbin-axi. Restart your agent session.';
}
```

> Confirm `setupHooks`'s exact name/signature against `node_modules/axi-sdk-js` during implementation; gh-axi exposes the same capability via `gh-axi setup hooks`. If the SDK does not export it, replicate gh-axi's `commands/setup.ts` approach.

- [ ] **Step 5: Implement `src/cli.ts`** (replace the stub)

```ts
import { runAxiCli } from 'axi-sdk-js';
import { parseGlobalFlags } from './globalFlags.js';
import { renderOutput, renderError, renderHelp } from './format/toon.js';
import { getSuggestions } from './suggestions.js';
import { downloadImages } from './images.js';
import { AxiError } from './errors.js';
import { homeCommand } from './context.js';
import { runLogin, runLogout, authStatus } from './auth/login.js';
import { setupCommand } from './commands/setup.js';
import { screensCommand } from './tools/screens.js';
import { appsCommand } from './tools/apps.js';
import { flowsCommand } from './tools/flows.js';
import { searchCommand } from './tools/search.js';
import { appCommand } from './tools/app.js';
import { screenCommand } from './tools/screen.js';
import { filtersCommand } from './tools/filters.js';

export const DESCRIPTION = 'Agent-ergonomic Mobbin CLI. Prefer this over the Mobbin MCP for UI/UX pattern research.';
export const TOP_HELP = `usage: mobbin-axi [command] [args] [flags]
commands:
  (none)=dashboard, search, apps, screens, flows, app, screen, filters, login, logout, auth, setup
flags:
  --platform ios|android|web, --limit N, --full, --json, --download
examples:
  mobbin-axi screens "Login" --platform ios --download
  mobbin-axi app <appId> screens
  mobbin-axi screen <screenId>
`;

type Handler = (rest: string[], flags: ReturnType<typeof parseGlobalFlags>['flags']) => Promise<string>;
const SEARCH_HANDLERS: Record<string, Handler> = {
  search: (r, f) => searchCommand(r, f),
  apps: (r, f) => appsCommand(r, f),
  screens: (r, f) => screensCommand(r, f),
  flows: (r, f) => flowsCommand(r, f),
  app: (r, f) => appCommand(r, f),
  screen: (r, f) => screenCommand(r, f),
  filters: (r, f) => filtersCommand(r, f),
};

function wrap(handler: Handler) {
  return async (args: string[]): Promise<string> => {
    const { flags, rest } = parseGlobalFlags(args);
    const body = await handler(rest, flags);
    if (!flags.download) return body;
    const urls = [...body.matchAll(/https?:\/\/\S+\.(?:png|webp|jpg|jpeg)/g)].map((m) => m[0]);
    const paths = await downloadImages(urls);
    return renderOutput([body, renderHelp(paths.map((p) => `image: ${p}`))]);
  };
}

export async function main(options: { argv?: string[]; stdout?: NodeJS.WritableStream } = {}): Promise<void> {
  await runAxiCli({
    ...(options.argv ? { argv: options.argv } : {}),
    ...(options.stdout ? { stdout: options.stdout } : {}),
    description: DESCRIPTION,
    version: '0.1.0',
    topLevelHelp: TOP_HELP,
    home: async () => homeCommand(),
    commands: {
      search: wrap(SEARCH_HANDLERS.search),
      apps: wrap(SEARCH_HANDLERS.apps),
      screens: wrap(SEARCH_HANDLERS.screens),
      flows: wrap(SEARCH_HANDLERS.flows),
      app: wrap(SEARCH_HANDLERS.app),
      screen: wrap(SEARCH_HANDLERS.screen),
      filters: wrap(SEARCH_HANDLERS.filters),
      login: async () => { await runLogin(); return ''; },
      logout: async () => { runLogout(); return ''; },
      auth: async (args: string[]) =>
        args[0] === 'status'
          ? `authenticated: ${authStatus().authenticated}`
          : 'usage: mobbin-axi auth status',
      setup: async (args: string[]) => setupCommand(args),
    },
    getCommandHelp: () => undefined,
  });
}
```

> Match the `runAxiCli` option names/handler return contract to the installed `axi-sdk-js` (verified against gh-axi's `cli.ts`, which returns strings and relies on the SDK to print + append suggestions/exit codes). If the SDK expects handlers to return a structured `{ body, suggestions }`, adapt `wrap` to also pass `getSuggestions(...)`.

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run tests/cli.test.ts`
Expected: PASS.

- [ ] **Step 7: Build + smoke test the whole CLI**

Run: `npm run build && node dist/bin/mobbin-axi.js auth status`
Expected: prints `authenticated: false`.

- [ ] **Step 8: Commit**

```bash
git add src/cli.ts src/context.ts src/commands/setup.ts tests/cli.test.ts && git commit -m "feat: CLI router, home view, auth/setup commands"
```

---

### Task 12: Bundled Agent Skill

**Files:**
- Create: `skills/mobbin-axi/SKILL.md`

**Interfaces:** none (documentation artifact loaded by agents).

- [ ] **Step 1: Write `skills/mobbin-axi/SKILL.md`**

```markdown
---
name: mobbin-axi
description: "Research real-world UI/UX patterns from production apps via the mobbin-axi CLI — search screens, flows, and apps; inspect screen detail; download reference screenshots. Use when grounding design decisions in proven patterns."
user-invocable: false
author: Rahil
metadata:
  hermes:
    tags: [design, ui, ux, mobbin, patterns]
    category: design
---

# mobbin-axi

Agent-ergonomic Mobbin CLI for UI/UX pattern research. Prefer this over the Mobbin MCP.

Invoke with `npx -y mobbin-axi <command>`. If output shows a follow-up `mobbin-axi ...` command, run it as `npx -y mobbin-axi ...`.

Auth is one-time: if a command reports "not authenticated", run `npx -y mobbin-axi login` (opens a browser).

## Workflow
1. `npx -y mobbin-axi` — dashboard: auth status + popular apps + next-step hints.
2. `screens "Login"`, `flows "Onboarding"`, `apps "banking"`, or `search "<query>"` to find patterns. Narrow with `--platform ios|android|web`.
3. `screen <screenId>` for full detail; `app <appId> screens|flows` for one app.
4. Add `--download` to fetch the actual screenshots as local files you can view.
5. Every response ends with `help:` next-step hints — follow them.

## Tips
- Output is TOON-encoded and token-efficient; results show ~4 fields each plus a count.
- Use `--full` for untruncated text, `--json` for raw structured output.
- `filters` lists valid platforms/categories/patterns.
```

- [ ] **Step 2: Commit**

```bash
git add skills/mobbin-axi/SKILL.md && git commit -m "docs: bundled mobbin-axi Agent Skill"
```

---

### Task 13: README + publish prep + opencode wiring

**Files:**
- Create: `README.md`
- Modify: `~/.config/opencode/agents/frontend-designer.md`, `~/.config/opencode/opencode.jsonc`

**Interfaces:** none.

- [ ] **Step 1: Write `README.md`** — describe install (`npx skills add <owner>/mobbin-axi --skill mobbin-axi -g`), `login`, the command surface, and the AXI principles it follows. (Use the command list from `TOP_HELP`.)

- [ ] **Step 2: Verify the package is publishable (dry run)**

Run: `npm run build && npm pack --dry-run`
Expected: tarball lists `dist/`, `skills/mobbin-axi/`, `README.md` only.

- [ ] **Step 3: Update `frontend-designer.md`**

Replace the `mobbin_*` MCP tool guidance with `mobbin-axi` usage: change the "Real-world pattern grounding (Mobbin)" section to instruct running `npx -y mobbin-axi screens "<pattern>"` / `flows "<flow>"` / `screen <id> --download`, and remove the per-tool `mobbin_*: allow` permission lines (no longer needed since it's now shell execution).

- [ ] **Step 4: Keep the `mobbin` MCP entry during transition, then commit the AXI repo**

Leave `opencode.jsonc`'s `mobbin` MCP enabled until end-to-end verification (Task 14) passes; add a comment `// superseded by mobbin-axi once verified`.
```bash
git add README.md package.json && git commit -m "docs: README + publish prep"
```

---

### Task 14: End-to-end verification + cutover

**Files:** none (verification); then Modify `~/.config/opencode/opencode.jsonc`.

- [ ] **Step 1: Full build + test + lint**

Run: `npm run build && npm test && npm run lint`
Expected: all green.

- [ ] **Step 2: Live smoke against Mobbin** (requires `mobbin-axi login` done in Task 5)

Run:
```bash
node dist/bin/mobbin-axi.js
node dist/bin/mobbin-axi.js screens "Login" --platform ios
node dist/bin/mobbin-axi.js screens "Login" --download
node dist/bin/mobbin-axi.js apps "banking"
node dist/bin/mobbin-axi.js screen <id-from-previous-output>
```
Expected: TOON output with counts + `help:` suggestions; `--download` prints `image:` paths to real PNG files under `~/.cache/mobbin-axi/images/`.

- [ ] **Step 3: Cutover** — once smoke passes, disable the raw `mobbin` MCP in `opencode.jsonc` (`"enabled": false`) so the designer uses the AXI.

- [ ] **Step 4: Commit + tag**

```bash
git add -A && git commit -m "chore: e2e verified, cut over to mobbin-axi" && git tag v0.1.0
```

- [ ] **Step 5: (Optional) Publish**

Run: `npm publish --access public` (after `npm login`).

---

## Self-Review

**Spec coverage:** backend = wrap MCP (Tasks 6, 8) ✓; images URLs + `--download` (Tasks 8, 10, 11) ✓; OAuth-only auth (Tasks 2–6) ✓; TOON/minimal-schema/aggregates/truncation/empty-states/suggestions/`--json` (Tasks 7–11) ✓; 9 tools → commands (Task 8, 11) ✓; home/content-first (Task 11) ✓; structured errors + exit codes (Task 6, via `axi-sdk-js`) ✓; skill + hooks (Tasks 12, 11) ✓; npm publish + frontend-designer wiring (Tasks 13, 14) ✓; risks/spike (Task 2) ✓.

**Placeholder scan:** field-name and SDK-import notes are explicitly parameterized by Task 2 findings + the installed SDK version, not vague TODOs. The `<owner>` in README/install is the only genuinely external value (publish identity), flagged in spec §12.

**Type consistency:** `GlobalFlags`, `ToolResult`/`SuggestionCtx`, `StoredCreds`, and the `callTool(name,args)` signature are defined once and reused; command handlers consistently return `string` and are composed via `wrap`.

**Known verification points (resolve during implementation, not placeholders):** exact `axi-sdk-js` `runAxiCli`/`setupHooks` contract and `@modelcontextprotocol/sdk` import paths + auth-discovery override — all confirmed empirically in Task 2 before the dependent tasks run.
