import { callTool } from '../mcp/client.js';
import { TOOLS } from '../config.js';
import { field, renderList, renderOutput, renderHelp } from '../format/toon.js';
import type { GlobalFlags } from '../globalFlags.js';
import { getSuggestions } from '../suggestions.js';

export interface ToolResult {
  blocks: string[];
  suggestion: { domain: string; action: string; isEmpty: boolean; id?: string };
}

export function mapApp(
  result: Record<string, unknown>,
  _flags: GlobalFlags,
  subcommand: 'screens' | 'flows',
): ToolResult {
  const key = subcommand;
  const items = (result[key] ?? []) as Record<string, unknown>[];
  const count = items.length;
  const header = `${count} result${count === 1 ? '' : 's'}`;

  if (count === 0) {
    return { blocks: ['0 results'], suggestion: { domain: key, action: 'view', isEmpty: true } };
  }

  const fields =
    subcommand === 'screens'
      ? [field('id'), field('appName', 'app'), field('pattern'), field('screenUrl', 'image')]
      : [field('id'), field('appName', 'app'), field('name', 'flow')];

  const list = renderList(key, items, fields);
  return { blocks: [header, list], suggestion: { domain: key, action: 'view', isEmpty: false } };
}

export async function appCommand(args: string[], flags: GlobalFlags): Promise<string> {
  const appId = args[0] || '';
  const subcommand = (args[1] === 'flows' ? 'flows' : 'screens') as 'screens' | 'flows';
  const toolName = subcommand === 'flows' ? TOOLS.getAppFlows : TOOLS.getAppScreens;
  const result = (await callTool(toolName, { appId })) as Record<string, unknown>;
  const mapped = mapApp(result, flags, subcommand);
  return renderOutput([...mapped.blocks, renderHelp(getSuggestions(mapped.suggestion))]);
}
