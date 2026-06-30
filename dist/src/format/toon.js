import { encode } from '@toon-format/toon';
export const field = (key, as) => ({ type: 'field', key, as });
export const pluck = (key, subkey, as) => ({ type: 'pluck', key, subkey, as });
export const custom = (as, fn) => ({ type: 'custom', as, fn });
function extract(item, schema) {
    const out = {};
    for (const def of schema) {
        const key = def.as ?? ('key' in def ? def.key : def.as);
        if (def.type === 'field')
            out[key] = item[def.key] ?? null;
        else if (def.type === 'pluck')
            out[key] = item[def.key]?.[def.subkey] ?? null;
        else
            out[key] = def.fn(item);
    }
    return out;
}
export function renderList(label, items, schema) {
    return encode({ [label]: items.map((i) => extract(i, schema)) });
}
export function renderDetail(label, item, schema) {
    return encode({ [label]: extract(item, schema) });
}
export function renderHelp(lines) {
    if (lines.length === 0)
        return '';
    return `help[${lines.length}]:\n${lines.map((l) => `  ${l}`).join('\n')}`;
}
export function renderError(message, code, suggestions = []) {
    const blocks = [encode({ error: message, code })];
    if (suggestions.length)
        blocks.push(renderHelp(suggestions));
    return blocks.join('\n');
}
export function renderOutput(blocks) {
    return blocks.filter(Boolean).join('\n');
}
//# sourceMappingURL=toon.js.map