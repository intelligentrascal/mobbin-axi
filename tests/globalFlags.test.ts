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
  it('accepts --type=equals form', () => {
    expect(parseGlobalFlags(['--type=feed']).flags.type).toBe('feed');
  });
  it('extracts --json flag', () => {
    expect(parseGlobalFlags(['--json']).flags.json).toBe(true);
  });
  it('extracts --popular flag', () => {
    expect(parseGlobalFlags(['--popular']).flags.popular).toBe(true);
  });
  it('extracts --type flag with space separator', () => {
    expect(parseGlobalFlags(['--type', 'feed']).flags.type).toBe('feed');
  });
  it('returns defaults when no flags are present', () => {
    const { flags, rest } = parseGlobalFlags(['Login', 'Dashboard']);
    expect(flags).toEqual({ full: false, json: false, download: false, popular: false });
    expect(rest).toEqual(['Login', 'Dashboard']);
  });
  it('treats unknown flags as positional args', () => {
    const { flags, rest } = parseGlobalFlags(['--unknown', '--verbose']);
    expect(flags.full).toBe(false);
    expect(rest).toEqual(['--unknown', '--verbose']);
  });
});
