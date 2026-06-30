import { randomUUID } from 'node:crypto';
import { loadCredentials, saveCredentials } from './store.js';
export const REDIRECT_PORT = 8765;
export const REDIRECT_URL = `http://localhost:${REDIRECT_PORT}/callback`;
export class MobbinOAuthProvider {
    onRedirect;
    lastState;
    verifier;
    discovery;
    constructor(onRedirect) {
        this.onRedirect = onRedirect;
    }
    redirectUrl = REDIRECT_URL;
    clientMetadata = {
        client_name: 'mobbin-axi',
        redirect_uris: [REDIRECT_URL],
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
    };
    clientInformation() {
        const byIssuer = loadCredentials()?.clientByIssuer;
        if (!byIssuer)
            return undefined;
        const issuer = this.discovery?.authorizationServerUrl;
        if (issuer)
            return byIssuer[issuer];
        const entries = Object.values(byIssuer);
        return entries[0];
    }
    saveClientInformation(info) {
        const issuer = this.discovery?.authorizationServerUrl ?? 'mobbin';
        const creds = loadCredentials() ?? {};
        creds.clientByIssuer = {
            ...(creds.clientByIssuer ?? {}),
            [issuer]: info,
        };
        saveCredentials(creds);
    }
    tokens() {
        return loadCredentials()?.tokens;
    }
    saveTokens(tokens) {
        const creds = loadCredentials() ?? {};
        creds.tokens = tokens;
        saveCredentials(creds);
    }
    state() {
        this.lastState = randomUUID();
        return this.lastState;
    }
    saveDiscoveryState(state) {
        this.discovery = state;
    }
    discoveryState() {
        return this.discovery;
    }
    redirectToAuthorization(url) {
        this.onRedirect(url);
    }
    saveCodeVerifier(v) {
        this.verifier = v;
    }
    codeVerifier() {
        if (!this.verifier)
            throw new Error('no code verifier');
        return this.verifier;
    }
    async invalidateCredentials(scope) {
        if (scope === 'all' || scope === 'tokens') {
            const creds = loadCredentials() ?? {};
            delete creds.tokens;
            saveCredentials(creds);
        }
        if (scope === 'all' || scope === 'client') {
            const issuer = this.discovery?.authorizationServerUrl;
            if (issuer) {
                const creds = loadCredentials() ?? {};
                if (creds.clientByIssuer) {
                    delete creds.clientByIssuer[issuer];
                    saveCredentials(creds);
                }
            }
        }
        if (scope === 'all' || scope === 'verifier') {
            this.verifier = undefined;
        }
        if (scope === 'all' || scope === 'discovery') {
            this.discovery = undefined;
        }
    }
}
//# sourceMappingURL=provider.js.map