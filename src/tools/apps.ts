import { callTool } from '../mcp/client.js';
import { TOOLS } from '../config.js';
import { field, renderList, renderOutput, renderHelp } from '../format/toon.js';
import type { GlobalFlags } from '../globalFlags.js';
import { getSuggestions } from '../suggestions.js';

export interface ToolResult {
  blocks: string[];
  suggestion: { domain: string; action: string; isEmpty: boolean; id?: string };
}

export function mapApps(result: { apps?: unknown[] }, _flags: GlobalFlags): ToolResult {
  const items = (result.apps ?? []) as Record<string, unknown>[];
  const count = items.length;
  const header = `${count} result${count === 1 ? '' : 's'}`;
  if (count === 0) {
    return { blocks: ['0 results'], suggestion: { domain: 'apps', action: 'search', isEmpty: true } };
  }
  const list = renderList('apps', items, [
    field('id'),
    field('appName', 'name'),
    field('appTagline', 'tagline'),
    field('appLogoUrl', 'logo'),
  ]);
  return { blocks: [header, list], suggestion: { domain: 'apps', action: 'search', isEmpty: false } };
}

export async function appsCommand(args: string[], flags: GlobalFlags): Promise<string> {
  if (flags.popular) {
    const mcpArgs: Record<string, unknown> = {};
    if (flags.platform) mcpArgs.platform = flags.platform;
    if (flags.limit) mcpArgs.limit = flags.limit;
    const result = (await callTool(TOOLS.popularApps, mcpArgs)) as { apps?: unknown[] };
    const mapped = mapApps(result, flags);
    return renderOutput([...mapped.blocks, renderHelp(getSuggestions(mapped.suggestion))]);
  }
  const query = args.join(' ');
  const mcpArgs: Record<string, unknown> = { query };
  if (flags.platform) mcpArgs.platform = flags.platform;
  if (flags.limit) mcpArgs.limit = flags.limit;
  const result = (await callTool(TOOLS.searchApps, mcpArgs)) as { apps?: unknown[] };
  const mapped = mapApps(result, flags);
  return renderOutput([...mapped.blocks, renderHelp(getSuggestions(mapped.suggestion))]);
}
