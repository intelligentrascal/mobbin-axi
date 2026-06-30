import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { MCP_URL } from '../config.js';
import { MobbinOAuthProvider } from '../auth/provider.js';
import { loadCredentials } from '../auth/store.js';
import { AxiError, mapMcpError } from '../errors.js';
let cached;
async function connect() {
    if (cached)
        return cached;
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
export async function closeClient() {
    if (cached) {
        try {
            await cached.close();
        }
        catch { /* best-effort */ }
        cached = undefined;
    }
}
export async function callTool(name, args) {
    try {
        const client = await connect();
        const result = await client.callTool({ name, arguments: args });
        return result.structuredContent ?? parseTextContent(result);
    }
    catch (error) {
        if (error instanceof AxiError)
            throw error;
        throw mapMcpError(error);
    }
}
export function parseTextContent(result) {
    const content = result.content;
    const items = Array.isArray(content) ? content : [];
    const text = items.find((c) => c.type === 'text')?.text;
    if (!text)
        return result;
    try {
        return JSON.parse(text);
    }
    catch {
        return { text };
    }
}
//# sourceMappingURL=client.js.map