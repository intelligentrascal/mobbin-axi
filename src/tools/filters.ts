import { callTool } from '../mcp/client.js';
import { TOOLS } from '../config.js';
import { field, renderList, renderOutput, renderHelp } from '../format/toon.js';
import type { GlobalFlags } from '../globalFlags.js';
import { getSuggestions } from '../suggestions.js';

export interface ToolResult {
  blocks: string[];
  suggestion: { domain: string; action: string; isEmpty: boolean; id?: string };
}

export function mapFilters(result: Record<string, unknown>, _flags: GlobalFlags): ToolResult {
  const blocks: string[] = [];
  let total = 0;

  for (const [key, value] of Object.entries(result)) {
    if (!Array.isArray(value)) continue;
    const items = value as Record<string, unknown>[];
    if (items.length === 0) continue;
    total += items.length;
    blocks.push(renderList(key, items, [field('id'), field('name')]));
  }

  if (total === 0) {
    return { blocks: ['0 results'], suggestion: { domain: 'filters', action: 'list', isEmpty: true } };
  }

  const header = `${total} filter${total === 1 ? '' : 's'}`;
  return { blocks: [header, ...blocks], suggestion: { domain: 'filters', action: 'list', isEmpty: false } };
}

export async function filtersCommand(_args: string[], flags: GlobalFlags): Promise<string> {
  const result = (await callTool(TOOLS.getFilters, {})) as Record<string, unknown>;
  const mapped = mapFilters(result, flags);
  return renderOutput([...mapped.blocks, renderHelp(getSuggestions(mapped.suggestion))]);
}
