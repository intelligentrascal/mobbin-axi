import { callTool } from '../mcp/client.js';
import { TOOLS } from '../config.js';
import { field, renderList, renderOutput } from '../format/toon.js';
import type { GlobalFlags } from '../globalFlags.js';

export interface ToolResult {
  blocks: string[];
  suggestion: { domain: string; action: string; isEmpty: boolean; id?: string };
}

export function mapFlows(result: { flows?: unknown[] }, _flags: GlobalFlags): ToolResult {
  const items = (result.flows ?? []) as Record<string, unknown>[];
  const count = items.length;
  const header = `${count} result${count === 1 ? '' : 's'}`;
  if (count === 0) {
    return { blocks: ['0 results'], suggestion: { domain: 'flows', action: 'search', isEmpty: true } };
  }
  const list = renderList('flows', items, [
    field('id'),
    field('appName', 'app'),
    field('name', 'flow'),
  ]);
  return { blocks: [header, list], suggestion: { domain: 'flows', action: 'search', isEmpty: false } };
}

export async function flowsCommand(args: string[], flags: GlobalFlags): Promise<string> {
  const query = args.join(' ');
  const mcpArgs: Record<string, unknown> = { query };
  if (flags.platform) mcpArgs.platform = flags.platform;
  if (flags.limit) mcpArgs.limit = flags.limit;
  const result = (await callTool(TOOLS.searchFlows, mcpArgs)) as { flows?: unknown[] };
  const mapped = mapFlows(result, flags);
  return renderOutput(mapped.blocks);
}
