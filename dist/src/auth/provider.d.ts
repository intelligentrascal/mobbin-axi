import type { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js';
import type { OAuthDiscoveryState } from '@modelcontextprotocol/sdk/client/auth.js';
import type { OAuthClientMetadata, OAuthClientInformationMixed, OAuthTokens } from '@modelcontextprotocol/sdk/shared/auth.js';
export declare const REDIRECT_PORT = 8765;
export declare const REDIRECT_URL = "http://localhost:8765/callback";
export declare class MobbinOAuthProvider implements OAuthClientProvider {
    private readonly onRedirect;
    lastState?: string;
    private verifier?;
    private discovery?;
    constructor(onRedirect: (url: URL) => void);
    readonly redirectUrl = "http://localhost:8765/callback";
    readonly clientMetadata: OAuthClientMetadata;
    clientInformation(): OAuthClientInformationMixed | undefined;
    saveClientInformation(info: OAuthClientInformationMixed): void;
    tokens(): OAuthTokens | undefined;
    saveTokens(tokens: OAuthTokens): void;
    state(): string;
    saveDiscoveryState(state: OAuthDiscoveryState): void;
    discoveryState(): OAuthDiscoveryState | undefined;
    redirectToAuthorization(url: URL): void;
    saveCodeVerifier(v: string): void;
    codeVerifier(): string;
    invalidateCredentials(scope: 'all' | 'client' | 'tokens' | 'verifier' | 'discovery'): Promise<void>;
}
