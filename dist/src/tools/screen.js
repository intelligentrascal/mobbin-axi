import { callTool } from '../mcp/client.js';
import { TOOLS } from '../config.js';
import { field, renderDetail, renderOutput, renderHelp } from '../format/toon.js';
import { getSuggestions } from '../suggestions.js';
export function mapScreen(result, _flags) {
    if (!result || Object.keys(result).length === 0) {
        return { blocks: ['0 results'], suggestion: { domain: 'screen', action: 'view', isEmpty: true } };
    }
    const detail = renderDetail('screen', result, [
        field('id'),
        field('appName', 'app'),
        field('pattern'),
        field('screenUrl', 'image'),
    ]);
    return { blocks: [detail], suggestion: { domain: 'screen', action: 'view', isEmpty: false, id: result.id } };
}
export async function screenCommand(args, flags) {
    const screenId = args[0] || '';
    const result = (await callTool(TOOLS.getScreenDetail, { screenId }));
    const mapped = mapScreen(result, flags);
    return renderOutput([...mapped.blocks, renderHelp(getSuggestions(mapped.suggestion))]);
}
//# sourceMappingURL=screen.js.map