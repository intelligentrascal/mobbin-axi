import { callTool } from '../mcp/client.js';
import { TOOLS } from '../config.js';
import { field, renderList, renderOutput, renderHelp } from '../format/toon.js';
import { getSuggestions } from '../suggestions.js';
export function mapApp(result, _flags, subcommand) {
    const key = subcommand;
    const items = (result[key] ?? []);
    const count = items.length;
    const header = `${count} result${count === 1 ? '' : 's'}`;
    if (count === 0) {
        return { blocks: ['0 results'], suggestion: { domain: key, action: 'view', isEmpty: true } };
    }
    const fields = subcommand === 'screens'
        ? [field('id'), field('appName', 'app'), field('pattern'), field('screenUrl', 'image')]
        : [field('id'), field('appName', 'app'), field('name', 'flow')];
    const list = renderList(key, items, fields);
    return { blocks: [header, list], suggestion: { domain: key, action: 'view', isEmpty: false } };
}
export async function appCommand(args, flags) {
    const appId = args[0] || '';
    const subcommand = (args[1] === 'flows' ? 'flows' : 'screens');
    const toolName = subcommand === 'flows' ? TOOLS.getAppFlows : TOOLS.getAppScreens;
    const result = (await callTool(toolName, { appId }));
    const mapped = mapApp(result, flags, subcommand);
    return renderOutput([...mapped.blocks, renderHelp(getSuggestions(mapped.suggestion))]);
}
//# sourceMappingURL=app.js.map