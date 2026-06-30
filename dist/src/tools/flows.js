import { callTool } from '../mcp/client.js';
import { TOOLS } from '../config.js';
import { field, renderList, renderOutput, renderHelp } from '../format/toon.js';
import { getSuggestions } from '../suggestions.js';
export function mapFlows(result, _flags) {
    const items = (result.flows ?? []);
    const count = items.length;
    const header = `${count} result${count === 1 ? '' : 's'}`;
    if (count === 0) {
        return { blocks: ['0 results'], suggestion: { domain: 'flows', action: 'search', isEmpty: true } };
    }
    const list = renderList('flows', items, [
        field('id'),
        field('appName', 'app'),
        field('name', 'flow'),
    ]);
    return { blocks: [header, list], suggestion: { domain: 'flows', action: 'search', isEmpty: false } };
}
export async function flowsCommand(args, flags) {
    const query = args.join(' ');
    const mcpArgs = { query };
    if (flags.platform)
        mcpArgs.platform = flags.platform;
    if (flags.limit)
        mcpArgs.limit = flags.limit;
    const result = (await callTool(TOOLS.searchFlows, mcpArgs));
    const mapped = mapFlows(result, flags);
    return renderOutput([...mapped.blocks, renderHelp(getSuggestions(mapped.suggestion))]);
}
//# sourceMappingURL=flows.js.map