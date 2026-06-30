import { callTool } from '../mcp/client.js';
import { TOOLS } from '../config.js';
import { field, renderList, renderOutput, renderHelp } from '../format/toon.js';
import { getSuggestions } from '../suggestions.js';
const DOMAIN_FIELDS = {
    apps: [field('id'), field('appName', 'app'), field('appTagline', 'tagline'), field('appLogoUrl', 'logo')],
    screens: [field('id'), field('appName', 'app'), field('pattern'), field('screenUrl', 'image')],
    flows: [field('id'), field('appName', 'app'), field('name', 'flow')],
};
function defaultFields() {
    return [field('id'), field('name')];
}
export function mapSearch(result, _flags) {
    let total = 0;
    const blocks = [];
    for (const [key, value] of Object.entries(result)) {
        if (!Array.isArray(value))
            continue;
        const items = value;
        if (items.length === 0)
            continue;
        total += items.length;
        const fields = DOMAIN_FIELDS[key] ?? defaultFields();
        blocks.push(renderList(key, items, fields));
    }
    if (total === 0) {
        return { blocks: ['0 results'], suggestion: { domain: 'search', action: 'search', isEmpty: true } };
    }
    const header = `${total} result${total === 1 ? '' : 's'}`;
    return { blocks: [header, ...blocks], suggestion: { domain: 'search', action: 'search', isEmpty: false } };
}
export async function searchCommand(args, flags) {
    const query = args.join(' ');
    const mcpArgs = { query };
    if (flags.platform)
        mcpArgs.platform = flags.platform;
    if (flags.limit)
        mcpArgs.limit = flags.limit;
    let toolName = TOOLS.quickSearch;
    if (flags.type === 'apps')
        toolName = TOOLS.searchApps;
    else if (flags.type === 'screens')
        toolName = TOOLS.searchScreens;
    else if (flags.type === 'flows')
        toolName = TOOLS.searchFlows;
    const result = (await callTool(toolName, mcpArgs));
    const mapped = mapSearch(result, flags);
    return renderOutput([...mapped.blocks, renderHelp(getSuggestions(mapped.suggestion))]);
}
//# sourceMappingURL=search.js.map