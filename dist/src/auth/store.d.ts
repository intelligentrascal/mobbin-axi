import type { OAuthTokens } from '@modelcontextprotocol/sdk/shared/auth.js';
export interface StoredCreds {
    tokens?: OAuthTokens;
    clientByIssuer?: Record<string, unknown>;
}
export declare function loadCredentials(): StoredCreds | undefined;
export declare function saveCredentials(creds: StoredCreds): void;
export declare function clearCredentials(): void;
