import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync, chmodSync, } from 'node:fs';
import { dirname, join } from 'node:path';
import { CREDENTIALS_PATH } from '../config.js';
function path() {
    const override = process.env.MOBBIN_CONFIG_DIR;
    return override ? join(override, 'credentials.json') : CREDENTIALS_PATH;
}
export function loadCredentials() {
    const p = path();
    if (!existsSync(p))
        return undefined;
    try {
        return JSON.parse(readFileSync(p, 'utf-8'));
    }
    catch {
        return undefined;
    }
}
export function saveCredentials(creds) {
    const p = path();
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, JSON.stringify(creds, null, 2), { mode: 0o600 });
    chmodSync(p, 0o600);
}
export function clearCredentials() {
    const p = path();
    if (existsSync(p))
        rmSync(p);
}
//# sourceMappingURL=store.js.map