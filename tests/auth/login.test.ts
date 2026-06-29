import { describe, it, expect } from 'vitest';
import { parseCallback } from '../../src/auth/login.js';

describe('parseCallback', () => {
  it('returns params when state matches', () => {
    const url = 'http://localhost:8765/callback?code=abc&state=s1';
    expect(parseCallback(url, 's1').get('code')).toBe('abc');
  });
  it('throws on state mismatch', () => {
    const url = 'http://localhost:8765/callback?code=abc&state=evil';
    expect(() => parseCallback(url, 's1')).toThrow(/state/);
  });
  it('throws when state param is missing', () => {
    const url = 'http://localhost:8765/callback?code=abc';
    expect(() => parseCallback(url, 's1')).toThrow(/state/);
  });
  it('throws when expected state is empty', () => {
    const url = 'http://localhost:8765/callback?code=abc&state=s1';
    expect(() => parseCallback(url, '')).toThrow(/state/);
  });
});
