import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

beforeEach(() => {
  process.env.MOBBIN_CONFIG_DIR = mkdtempSync(join(tmpdir(), 'mobbin-'));
});

describe('MobbinOAuthProvider', () => {
  it('round-trips code verifier in memory on the same instance', async () => {
    const { MobbinOAuthProvider } = await import(
      '../../src/auth/provider.js?u=' + Date.now()
    );
    const p = new MobbinOAuthProvider(() => {});
    p.saveCodeVerifier('v123');
    expect(p.codeVerifier()).toBe('v123');
  });

  it('persists tokens through the store across instances', async () => {
    const { MobbinOAuthProvider } = await import(
      '../../src/auth/provider.js?u=' + Date.now()
    );
    const p = new MobbinOAuthProvider(() => {});
    p.saveTokens({
      access_token: 'tok',
      token_type: 'Bearer',
    } as any);
    const p2 = new MobbinOAuthProvider(() => {});
    expect(p2.tokens()?.access_token).toBe('tok');
  });

  it('produces a random state and exposes it as lastState', async () => {
    const { MobbinOAuthProvider } = await import(
      '../../src/auth/provider.js?u=' + Date.now()
    );
    const p = new MobbinOAuthProvider(() => {});
    const s = p.state();
    expect(s).toEqual(p.lastState);
    expect(s.length).toBeGreaterThan(10);
  });

  it('persists and loads client information keyed by discovery issuer', async () => {
    const { MobbinOAuthProvider } = await import(
      '../../src/auth/provider.js?u=' + Date.now()
    );
    const p = new MobbinOAuthProvider(() => {});
    // Seed discovery so the issuer key is known
    p.saveDiscoveryState({
      authorizationServerUrl: 'https://auth.mobbin.com',
    });

    const info = {
      client_id: 'mobbin-client-id',
      client_secret: 'secret',
    } as any;
    p.saveClientInformation(info);
    expect(p.clientInformation()).toEqual(info);
  });

  it('clientInformation returns undefined when nothing is stored', async () => {
    const { MobbinOAuthProvider } = await import(
      '../../src/auth/provider.js?u=' + Date.now()
    );
    const p = new MobbinOAuthProvider(() => {});
    expect(p.clientInformation()).toBeUndefined();
  });

  it('codeVerifier throws on new instance that never saved one', async () => {
    const { MobbinOAuthProvider } = await import(
      '../../src/auth/provider.js?u=' + Date.now()
    );
    const p = new MobbinOAuthProvider(() => {});
    expect(() => p.codeVerifier()).toThrow('no code verifier');
  });

  it('exposes redirectUrl and clientMetadata', async () => {
    const { MobbinOAuthProvider, REDIRECT_URL } = await import(
      '../../src/auth/provider.js?u=' + Date.now()
    );
    const p = new MobbinOAuthProvider(() => {});
    expect(p.redirectUrl).toBe(REDIRECT_URL);
    expect(p.clientMetadata.client_name).toBe('mobbin-axi');
    expect(p.clientMetadata.grant_types).toContain('authorization_code');
  });

  it('calls onRedirect when redirectToAuthorization is invoked', async () => {
    const { MobbinOAuthProvider } = await import(
      '../../src/auth/provider.js?u=' + Date.now()
    );
    let redirectedTo: URL | undefined;
    const p = new MobbinOAuthProvider((url) => {
      redirectedTo = url;
    });
    const testUrl = new URL('https://auth.mobbin.com/authorize?foo=bar');
    p.redirectToAuthorization(testUrl);
    expect(redirectedTo?.href).toBe(testUrl.href);
  });
});
