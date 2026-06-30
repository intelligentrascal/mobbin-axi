import { callTool } from '../mcp/client.js';
import { TOOLS } from '../config.js';
import { field, renderList, renderOutput, renderHelp } from '../format/toon.js';
import { getSuggestions } from '../suggestions.js';
export function mapFilters(result, _flags) {
    const blocks = [];
    let total = 0;
    for (const [key, value] of Object.entries(result)) {
        if (!Array.isArray(value))
            continue;
        const items = value;
        if (items.length === 0)
            continue;
        total += items.length;
        blocks.push(renderList(key, items, [field('id'), field('name')]));
    }
    if (total === 0) {
        return { blocks: ['0 results'], suggestion: { domain: 'filters', action: 'list', isEmpty: true } };
    }
    const header = `${total} filter${total === 1 ? '' : 's'}`;
    return { blocks: [header, ...blocks], suggestion: { domain: 'filters', action: 'list', isEmpty: false } };
}
export async function filtersCommand(_args, flags) {
    const result = (await callTool(TOOLS.getFilters, {}));
    const mapped = mapFilters(result, flags);
    return renderOutput([...mapped.blocks, renderHelp(getSuggestions(mapped.suggestion))]);
}
//# sourceMappingURL=filters.js.map