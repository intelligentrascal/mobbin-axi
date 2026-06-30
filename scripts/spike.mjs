import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { MobbinOAuthProvider } from '../dist/src/auth/provider.js';
import { MCP_URL } from '../dist/src/config.js';

const provider = new MobbinOAuthProvider(() => {
  throw new Error('session expired — run login again');
});
const client = new Client({ name: 'mobbin-axi-spike', version: '0.1.0' });
await client.connect(new StreamableHTTPClientTransport(new URL(MCP_URL), { authProvider: provider }));

async function tryCall(name, args) {
  console.log(`\n=== ${name} ${JSON.stringify(args)} ===`);
  try {
    const r = await client.callTool({ name, arguments: args });
    console.log('content block types:', JSON.stringify((r.content ?? []).map((c) => c.type)));
    const text = (r.content ?? []).find((c) => c.type === 'text')?.text;
    if (r.structuredContent !== undefined) {
      console.log('structuredContent keys:', JSON.stringify(Object.keys(r.structuredContent)));
      console.log('structuredContent:', JSON.stringify(r.structuredContent).slice(0, 2000));
    }
    if (text) console.log('TEXT:', text.slice(0, 2000));
  } catch (e) {
    console.log('ERROR:', e?.message ?? String(e));
  }
}

await tryCall('search_screens', { query: 'login screen with biometric authentication', platform: 'ios', limit: 2 });
await tryCall('search_flows', { query: 'onboarding', platform: 'ios', limit: 1 });
await tryCall('search_sections', { query: 'pricing page', limit: 2 });

await client.close();
process.exit(0);
