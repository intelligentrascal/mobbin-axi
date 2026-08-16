import { describe, it, expect } from 'vitest';
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
  it('extracts --json flag', () => {
    expect(parseGlobalFlags(['--json']).flags.json).toBe(true);
  });
  it('returns defaults when no flags are present', () => {
    const { flags, rest } = parseGlobalFlags(['Login', 'Dashboard']);
    expect(flags).toEqual({ full: false, json: false, download: false });
    expect(rest).toEqual(['Login', 'Dashboard']);
  });
  it('rejects --type with VALIDATION_ERROR', () => {
    expect(() => parseGlobalFlags(['--type', 'feed'])).toThrow('--type is not a recognized flag');
  });
  it('rejects --type=equals form with VALIDATION_ERROR', () => {
    expect(() => parseGlobalFlags(['--type=feed'])).toThrow('--type is not a recognized flag');
  });
  it('rejects invalid --platform with VALIDATION_ERROR', () => {
    expect(() => parseGlobalFlags(['--platform', 'android'])).toThrow('--platform must be');
  });
  it('rejects invalid --platform=equals form', () => {
    expect(() => parseGlobalFlags(['--platform=android'])).toThrow('--platform must be');
  });
  it('rejects --limit with non-numeric value', () => {
    expect(() => parseGlobalFlags(['--limit', 'abc'])).toThrow('--limit must be a positive integer');
  });
  it('rejects --limit=NaN via equals form', () => {
    expect(() => parseGlobalFlags(['--limit=abc'])).toThrow('--limit must be a positive integer');
  });
  it('rejects --limit with zero', () => {
    expect(() => parseGlobalFlags(['--limit', '0'])).toThrow('--limit must be a positive integer');
  });
  it('rejects --limit with negative value', () => {
    expect(() => parseGlobalFlags(['--limit', '-1'])).toThrow('--limit must be a positive integer');
  });
  it('rejects --limit at end-of-args (no value)', () => {
    expect(() => parseGlobalFlags(['--limit'])).toThrow('--limit requires a positive integer value');
  });
  it('rejects --limit when next arg is another flag', () => {
    expect(() => parseGlobalFlags(['--limit', '--json'])).toThrow('--limit requires a positive integer value');
  });
  it('rejects --limit= with empty value (equals form)', () => {
    expect(() => parseGlobalFlags(['--limit='])).toThrow('--limit requires a positive integer value');
  });
  it('rejects unknown flags with VALIDATION_ERROR', () => {
    expect(() => parseGlobalFlags(['--unknown', '--verbose'])).toThrow('--unknown is not a recognized flag');
    expect(() => parseGlobalFlags(['--verbose'])).toThrow('--verbose is not a recognized flag');
  });
});
