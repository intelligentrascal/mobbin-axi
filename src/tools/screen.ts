import { callTool } from '../mcp/client.js';
import { TOOLS } from '../config.js';
import { field, renderDetail, renderOutput } from '../format/toon.js';
import type { GlobalFlags } from '../globalFlags.js';

export interface ToolResult {
  blocks: string[];
  suggestion: { domain: string; action: string; isEmpty: boolean; id?: string };
}

export function mapScreen(result: Record<string, unknown> | null | undefined, _flags: GlobalFlags): ToolResult {
  if (!result || Object.keys(result).length === 0) {
    return { blocks: ['0 results'], suggestion: { domain: 'screen', action: 'view', isEmpty: true } };
  }
  const detail = renderDetail('screen', result, [
    field('id'),
    field('appName', 'app'),
    field('pattern'),
    field('screenUrl', 'image'),
  ]);
  return { blocks: [detail], suggestion: { domain: 'screen', action: 'view', isEmpty: false, id: result.id as string | undefined } };
}

export async function screenCommand(args: string[], flags: GlobalFlags): Promise<string> {
  const screenId = args[0] || '';
  const result = (await callTool(TOOLS.getScreenDetail, { screenId })) as Record<string, unknown>;
  const mapped = mapScreen(result, flags);
  return renderOutput(mapped.blocks);
}
