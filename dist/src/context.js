import { callTool } from './mcp/client.js';
import { TOOLS } from './config.js';
import { field, renderList, renderHelp, renderOutput } from './format/toon.js';
import { authStatus } from './auth/login.js';
import { getSuggestions } from './suggestions.js';
export async function homeCommand() {
    const status = authStatus();
    if (!status.authenticated) {
        return renderOutput([
            'mobbin-axi: not authenticated',
            renderHelp(['Run `mobbin-axi login` to authenticate with Mobbin']),
        ]);
    }
    let popular = '';
    try {
        const res = (await callTool(TOOLS.popularApps, {}));
        popular = renderList('popular_apps', (res.apps ?? []).slice(0, 5), [
            field('id'),
            field('appName', 'name'),
            field('appTagline', 'tagline'),
        ]);
    }
    catch {
        popular = '';
    }
    return renderOutput([popular, renderHelp(getSuggestions({ domain: 'home', action: 'home', isEmpty: false }))]);
}
//# sourceMappingURL=context.js.map