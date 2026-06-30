import { renderHelp, renderOutput } from './format/toon.js';
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
    return renderOutput([
        renderHelp(getSuggestions({ domain: 'home', action: 'home', isEmpty: false })),
    ]);
}
//# sourceMappingURL=context.js.map