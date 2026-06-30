import { callTool } from '../mcp/client.js';
import { TOOLS } from '../config.js';
import { field, renderList, renderOutput, renderHelp } from '../format/toon.js';
import { getSuggestions } from '../suggestions.js';
export function mapApps(result, _flags) {
    const items = (result.apps ?? []);
    const count = items.length;
    const header = `${count} result${count === 1 ? '' : 's'}`;
    if (count === 0) {
        return { blocks: ['0 results'], suggestion: { domain: 'apps', action: 'search', isEmpty: true } };
    }
    const list = renderList('apps', items, [
        field('id'),
        field('appName', 'name'),
        field('appTagline', 'tagline'),
        field('appLogoUrl', 'logo'),
    ]);
    return { blocks: [header, list], suggestion: { domain: 'apps', action: 'search', isEmpty: false } };
}
export async function appsCommand(args, flags) {
    if (flags.popular) {
        const mcpArgs = {};
        if (flags.platform)
            mcpArgs.platform = flags.platform;
        if (flags.limit)
            mcpArgs.limit = flags.limit;
        const result = (await callTool(TOOLS.popularApps, mcpArgs));
        const mapped = mapApps(result, flags);
        return renderOutput([...mapped.blocks, renderHelp(getSuggestions(mapped.suggestion))]);
    }
    const query = args.join(' ');
    const mcpArgs = { query };
    if (flags.platform)
        mcpArgs.platform = flags.platform;
    if (flags.limit)
        mcpArgs.limit = flags.limit;
    const result = (await callTool(TOOLS.searchApps, mcpArgs));
    const mapped = mapApps(result, flags);
    return renderOutput([...mapped.blocks, renderHelp(getSuggestions(mapped.suggestion))]);
}
//# sourceMappingURL=apps.js.map