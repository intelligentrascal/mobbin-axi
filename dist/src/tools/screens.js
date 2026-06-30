import { callTool } from '../mcp/client.js';
import { TOOLS } from '../config.js';
import { field, renderList, renderOutput, renderHelp } from '../format/toon.js';
import { getSuggestions } from '../suggestions.js';
export function mapScreens(result, _flags) {
    const items = (result.screens ?? []);
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
export async function screensCommand(args, flags) {
    const query = args.join(' ');
    const platform = flags.platform ?? 'ios';
    const mcpArgs = { query, platform };
    if (flags.limit)
        mcpArgs.limit = flags.limit;
    const result = (await callTool(TOOLS.searchScreens, mcpArgs));
    const mapped = mapScreens(result, flags);
    return renderOutput([...mapped.blocks, renderHelp(getSuggestions(mapped.suggestion))]);
}
//# sourceMappingURL=screens.js.map