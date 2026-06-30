import { callTool } from '../mcp/client.js';
import { TOOLS } from '../config.js';
import { field, renderList, renderOutput, renderHelp } from '../format/toon.js';
import { getSuggestions } from '../suggestions.js';
export function mapSections(result, _flags) {
    const items = (result.sections ?? []);
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
export async function sectionsCommand(args, flags) {
    const query = args.join(' ');
    const mcpArgs = { query };
    if (flags.limit)
        mcpArgs.limit = flags.limit;
    const result = (await callTool(TOOLS.searchSections, mcpArgs));
    const mapped = mapSections(result, flags);
    return renderOutput([...mapped.blocks, renderHelp(getSuggestions(mapped.suggestion))]);
}
//# sourceMappingURL=sections.js.map