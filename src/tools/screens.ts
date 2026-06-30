import { callTool } from '../mcp/client.js';
import { TOOLS } from '../config.js';
import { field, renderList, renderOutput, renderHelp } from '../format/toon.js';
import type { GlobalFlags } from '../globalFlags.js';
import { getSuggestions } from '../suggestions.js';

export interface ToolResult {
  blocks: string[];
  suggestion: { domain: string; action: string; isEmpty: boolean; id?: string };
}

export function mapScreens(result: { screens?: unknown[] }, _flags: GlobalFlags): ToolResult {
  const items = (result.screens ?? []) as Record<string, unknown>[];
  const count = items.length;
  const header = `${count} result${count === 1 ? '' : 's'}`;
  if (count === 0) {
    return { blocks: ['0 results'], suggestion: { domain: 'screens', action: 'search', isEmpty: true } };
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
  return renderOutput([...mapped.blocks, renderHelp(getSuggestions(mapped.suggestion))]);
}
