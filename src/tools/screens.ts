import { callTool } from '../mcp/client.js';
import { TOOLS } from '../config.js';
import { field, renderList, renderOutput, renderHelp } from '../format/toon.js';
import type { GlobalFlags } from '../globalFlags.js';
import { getSuggestions } from '../suggestions.js';
import type { ToolResult } from './types.js';

export function mapScreens(result: { screens?: unknown[] }, _flags: GlobalFlags): ToolResult {
  const items = (result.screens ?? []) as Record<string, unknown>[];
  const count = items.length;

  if (count === 0) {
    return { blocks: ['0 results'], suggestion: { domain: 'screens', action: 'search', isEmpty: true } };
  }

  const header = `${count} result${count === 1 ? '' : 's'}`;
  const list = renderList('screens', items, [
    field('id'),
    field('app_name', 'app'),
    field('platform'),
    field('image_url', 'image'),
  ]);
  return { blocks: [header, list], suggestion: { domain: 'screens', action: 'search', isEmpty: false } };
}

export async function screensCommand(args: string[], flags: GlobalFlags): Promise<string> {
  const query = args.join(' ');
  const platform = flags.platform ?? 'ios';
  const mcpArgs: Record<string, unknown> = { query, platform };
  if (flags.limit) mcpArgs.limit = flags.limit;
  const result = (await callTool(TOOLS.searchScreens, mcpArgs)) as { screens?: unknown[] };
  const mapped = mapScreens(result, flags);
  return renderOutput([...mapped.blocks, renderHelp(getSuggestions(mapped.suggestion))]);
}
