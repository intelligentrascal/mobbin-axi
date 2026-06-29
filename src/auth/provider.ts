import { randomUUID } from 'node:crypto';
import type { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js';
import type { OAuthDiscoveryState } from '@modelcontextprotocol/sdk/client/auth.js';
import type {
  OAuthClientMetadata,
  OAuthClientInformationMixed,
  OAuthTokens,
} from '@modelcontextprotocol/sdk/shared/auth.js';
import { loadCredentials, saveCredentials } from './store.js';

export const REDIRECT_PORT = 8765;
export const REDIRECT_URL = `http://localhost:${REDIRECT_PORT}/callback`;

export class MobbinOAuthProvider implements OAuthClientProvider {
  lastState?: string;
  private verifier?: string;
  private discovery?: OAuthDiscoveryState;

  constructor(private readonly onRedirect: (url: URL) => void) {}

  readonly redirectUrl = REDIRECT_URL;
  readonly clientMetadata: OAuthClientMetadata = {
    client_name: 'mobbin-axi',
    redirect_uris: [REDIRECT_URL],
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
  };

  clientInformation(): OAuthClientInformationMixed | undefined {
    const byIssuer = loadCredentials()?.clientByIssuer;
    if (!byIssuer) return undefined;
    const entries = Object.values(byIssuer);
    return (entries.length > 0
      ? (entries[0] as OAuthClientInformationMixed)
      : undefined);
  }

  saveClientInformation(info: OAuthClientInformationMixed): void {
    const issuer = this.discovery?.authorizationServerUrl ?? 'mobbin';
    const creds = loadCredentials() ?? {};
    creds.clientByIssuer = {
      ...(creds.clientByIssuer ?? {}),
      [issuer]: info,
    };
    saveCredentials(creds);
  }

  tokens(): OAuthTokens | undefined {
    return loadCredentials()?.tokens;
  }

  saveTokens(tokens: OAuthTokens): void {
    const creds = loadCredentials() ?? {};
    creds.tokens = tokens;
    saveCredentials(creds);
  }

  state(): string {
    this.lastState = randomUUID();
    return this.lastState;
  }

  saveDiscoveryState(state: OAuthDiscoveryState): void {
    this.discovery = state;
  }

  discoveryState(): OAuthDiscoveryState | undefined {
    return this.discovery;
  }

  redirectToAuthorization(url: URL): void {
    this.onRedirect(url);
  }

  saveCodeVerifier(v: string): void {
    this.verifier = v;
  }

  codeVerifier(): string {
    if (!this.verifier) throw new Error('no code verifier');
    return this.verifier;
  }
}
