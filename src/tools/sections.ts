import { callTool } from '../mcp/client.js';
import { TOOLS } from '../config.js';
import { field, renderList, renderOutput, renderHelp } from '../format/toon.js';
import type { GlobalFlags } from '../globalFlags.js';
import { getSuggestions } from '../suggestions.js';
import type { ToolResult } from './types.js';
import { AxiError } from '../errors.js';

export function mapSections(result: { sections?: unknown[] }, _flags: GlobalFlags): ToolResult {
  const items = (result.sections ?? []) as Record<string, unknown>[];
  const count = items.length;

  if (count === 0) {
    return { blocks: ['0 results'], suggestion: { domain: 'sections', action: 'search', isEmpty: true } };
  }

  const header = `${count} result${count === 1 ? '' : 's'}`;
  const list = renderList('sections', items, [
    field('id'),
    field('site_name', 'site'),
    field('image_url', 'image'),
  ]);
  return { blocks: [header, list], suggestion: { domain: 'sections', action: 'search', isEmpty: false } };
}

export async function sectionsCommand(args: string[], flags: GlobalFlags): Promise<string> {
  const query = args.join(' ').trim();
  if (!query) throw new AxiError('search query is required', 'VALIDATION_ERROR', ['e.g., mobbin-axi sections "pricing page"']);
  const mcpArgs: Record<string, unknown> = { query };
  if (flags.limit) mcpArgs.limit = flags.limit;
  const result = (await callTool(TOOLS.searchSections, mcpArgs)) as { sections?: unknown[] };
  const mapped = mapSections(result, flags);
  return renderOutput([...mapped.blocks, renderHelp(getSuggestions(mapped.suggestion))]);
}
