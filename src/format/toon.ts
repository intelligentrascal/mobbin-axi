import { encode } from '@toon-format/toon';

export type FieldDef =
  | { type: 'field'; key: string; as?: string }
  | { type: 'pluck'; key: string; subkey: string; as?: string }
  | { type: 'custom'; as: string; fn: (item: Record<string, unknown>) => unknown };

export const field = (key: string, as?: string): FieldDef => ({ type: 'field', key, as });
export const pluck = (key: string, subkey: string, as?: string): FieldDef => ({ type: 'pluck', key, subkey, as });
export const custom = (as: string, fn: (i: Record<string, unknown>) => unknown): FieldDef => ({ type: 'custom', as, fn });

function extract(item: Record<string, unknown>, schema: FieldDef[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const def of schema) {
    const key = def.as ?? ('key' in def ? def.key : def.as);
    if (def.type === 'field') out[key] = item[def.key] ?? null;
    else if (def.type === 'pluck') out[key] = (item[def.key] as Record<string, unknown>)?.[def.subkey] ?? null;
    else if (def.type === 'custom') out[key] = def.fn(item);
    else { const _exhaustive: never = def; throw new Error(`Unreachable: unknown FieldDef type ${(_exhaustive as FieldDef).type}`); }
  }
  return out;
}

export function renderList(label: string, items: Record<string, unknown>[], schema: FieldDef[]): string {
  return encode({ [label]: items.map((i) => extract(i, schema)) });
}

export function renderDetail(label: string, item: Record<string, unknown>, schema: FieldDef[]): string {
  return encode({ [label]: extract(item, schema) });
}

export function renderHelp(lines: string[]): string {
  if (lines.length === 0) return '';
  return `help[${lines.length}]:\n${lines.map((l) => `  ${l}`).join('\n')}`;
}

export function renderError(message: string, code: string, suggestions: string[] = []): string {
  const blocks = [encode({ error: message, code })];
  if (suggestions.length) blocks.push(renderHelp(suggestions));
  return blocks.join('\n');
}

export function renderOutput(blocks: string[]): string {
  return blocks.filter(Boolean).join('\n');
}
