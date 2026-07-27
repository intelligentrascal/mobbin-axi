import { describe, it, expect } from 'vitest';
import { AxiError } from 'axi-sdk-js';
import { parseGlobalFlags } from '../src/globalFlags.js';

describe('parseGlobalFlags', () => {
  it('extracts known flags and leaves positional args', () => {
    const { flags, rest } = parseGlobalFlags(['Login', '--platform', 'ios', '--limit', '5', '--full', '--download']);
    expect(flags.platform).toBe('ios');
    expect(flags.limit).toBe(5);
    expect(flags.full).toBe(true);
    expect(flags.download).toBe(true);
    expect(rest).toEqual(['Login']);
  });
  it('accepts --platform=web equals form', () => {
    expect(parseGlobalFlags(['--platform=web']).flags.platform).toBe('web');
  });
  it('accepts --limit=N equals form', () => {
    expect(parseGlobalFlags(['--limit=10']).flags.limit).toBe(10);
  });
  it('accepts --type=equals form', () => {
    expect(parseGlobalFlags(['--type=feed']).flags.type).toBe('feed');
  });
  it('extracts --json flag', () => {
    expect(parseGlobalFlags(['--json']).flags.json).toBe(true);
  });
  it('extracts --type flag with space separator', () => {
    expect(parseGlobalFlags(['--type', 'feed']).flags.type).toBe('feed');
  });
  it('returns defaults when no flags are present', () => {
    const { flags, rest } = parseGlobalFlags(['Login', 'Dashboard']);
    expect(flags).toEqual({ full: false, json: false, download: false });
    expect(rest).toEqual(['Login', 'Dashboard']);
  });
  it('rejects --limit at end-of-args (no value provided)', () => {
    const { flags } = parseGlobalFlags(['--limit']);
    expect(flags.limit).toBeUndefined();
  });
  it('rejects --limit with non-numeric value', () => {
    const { flags } = parseGlobalFlags(['--limit', 'abc']);
    expect(flags.limit).toBeUndefined();
  });
  it('rejects --limit=NaN via equals form', () => {
    const { flags } = parseGlobalFlags(['--limit=abc']);
    expect(flags.limit).toBeUndefined();
  });
  it('rejects --limit when next arg is another flag', () => {
    const { flags } = parseGlobalFlags(['--limit', '--json']);
    expect(flags.limit).toBeUndefined();
  });
  it('rejects --limit= with empty value (equals form)', () => {
    const { flags } = parseGlobalFlags(['--limit=']);
    expect(flags.limit).toBeUndefined();
  });
  it('rejects --limit with empty string value (space form)', () => {
    const { flags } = parseGlobalFlags(['--limit', '']);
    expect(flags.limit).toBeUndefined();
  });
  it('rejects unknown flags with a structured VALIDATION_ERROR', () => {
    expect(() => parseGlobalFlags(['--unknown'])).toThrow(AxiError);
    try {
      parseGlobalFlags(['--unknown', '--verbose']);
    } catch (e) {
      expect(e).toBeInstanceOf(AxiError);
      expect((e as AxiError).code).toBe('VALIDATION_ERROR');
    }
  });
});
