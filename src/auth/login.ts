import { createServer } from 'node:http';
import open from 'open';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { UnauthorizedError } from '@modelcontextprotocol/sdk/client/auth.js';
import { MCP_URL } from '../config.js';
import { MobbinOAuthProvider, REDIRECT_PORT } from './provider.js';
import { loadCredentials, clearCredentials } from './store.js';

export function parseCallback(
  callbackUrl: string,
  expectedState: string,
): URLSearchParams {
  const params = new URL(callbackUrl).searchParams;
  if (params.get('state') !== expectedState) throw new Error('state mismatch');
  return params;
}

function waitForCallback(
  provider: MobbinOAuthProvider,
): Promise<URLSearchParams> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      if (!req.url?.startsWith('/callback')) {
        res.writeHead(404).end();
        return;
      }
      try {
        const params = parseCallback(
          `http://localhost:${REDIRECT_PORT}${req.url}`,
          provider.lastState ?? '',
        );
        res
          .writeHead(200, { 'content-type': 'text/html' })
          .end('<p>mobbin-axi: you can close this tab.</p>');
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
  const provider = new MobbinOAuthProvider(
    (url) => void open(url.toString()),
  );
  const client = new Client({ name: 'mobbin-axi', version: '0.1.0' });
  try {
    await client.connect(
      new StreamableHTTPClientTransport(new URL(MCP_URL), {
        authProvider: provider,
      }),
    );
    process.stdout.write('Already authenticated.\n');
    return;
  } catch (error) {
    const root =
      error instanceof UnauthorizedError
        ? error
        : (error as { data?: { cause?: unknown } }).data?.cause;
    if (!(root instanceof UnauthorizedError)) throw error;
  }
  const params = await waitForCallback(provider);
  // v1.29.0 adaptation: finishAuth takes authorizationCode string, not URLSearchParams
  const authTransport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
    authProvider: provider,
  });
  const code = params.get('code');
  if (!code) throw new Error('authorization code missing from callback');
  await authTransport.finishAuth(code);
  await new Client({ name: 'mobbin-axi', version: '0.1.0' }).connect(
    new StreamableHTTPClientTransport(new URL(MCP_URL), {
      authProvider: provider,
    }),
  );
  process.stdout.write('Login successful.\n');
}

export function runLogout(): void {
  clearCredentials();
  process.stdout.write('Logged out.\n');
}

export function authStatus(): { authenticated: boolean } {
  return { authenticated: Boolean(loadCredentials()?.tokens?.access_token) };
}
