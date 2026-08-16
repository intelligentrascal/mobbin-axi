import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { MCP_URL } from '../config.js';
import { MobbinOAuthProvider } from '../auth/provider.js';
import { loadCredentials } from '../auth/store.js';
import { AxiError, mapMcpError } from '../errors.js';

let cached: Client | undefined;
let connecting: Promise<Client> | undefined;

async function connect(): Promise<Client> {
  if (cached) return cached;
  if (connecting) return connecting;
  connecting = (async () => {
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
  })();
  try {
    return await connecting;
  } finally {
    connecting = undefined;
  }
}

export async function closeClient(): Promise<void> {
  connecting = undefined;
  if (cached) {
    try { await cached.close(); } catch { /* best-effort */ }
    cached = undefined;
  }
}

export async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  try {
    const client = await connect();
    const result = await client.callTool({ name, arguments: args });
    if ((result as { isError?: boolean }).isError) {
      const items = Array.isArray((result as { content?: unknown }).content)
        ? (result as { content: Array<{ type: string; text?: string }> }).content
        : [];
      const text = items.find((c) => c.type === 'text')?.text ?? 'MCP tool returned an error';
      throw new AxiError(text, 'MCP_ERROR');
    }
    return (result as { structuredContent?: unknown }).structuredContent ?? parseTextContent(result);
  } catch (error) {
    if (error instanceof AxiError) throw error;
    throw mapMcpError(error);
  }
}

export function parseTextContent(result: unknown): unknown {
  const content = (result as { content?: unknown }).content;
  const items = Array.isArray(content) ? (content as Array<{ type: string; text?: string }>) : [];
  const text = items.find((c) => c.type === 'text')?.text;
  if (!text) return result;
  try { return JSON.parse(text); } catch { return { text }; }
}
