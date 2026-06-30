import { describe, it, expect } from 'vitest';
import { field, pluck, custom, renderList, renderDetail, renderHelp, renderError, renderOutput } from '../../src/format/toon.js';
import { truncate } from '../../src/format/truncate.js';

describe('toon helpers', () => {
  it('renders a labeled list with selected fields', () => {
    const out = renderList('apps', [{ id: '1', appName: 'Airbnb', extra: 'drop' }], [field('id'), field('appName', 'name')]);
    expect(out).toContain('apps');
    expect(out).toContain('Airbnb');
    expect(out).not.toContain('drop');
  });

  it('plucks nested values', () => {
    const out = renderList('x', [{ a: { b: 'v' } }], [pluck('a', 'b', 'name')]);
    expect(out).toContain('v');
  });

  it('renders help lines', () => {
    const out = renderHelp(['do x', 'do y']);
    expect(out).toContain('help[2]');
    expect(out).toContain('do x');
    expect(out).toContain('do y');
  });

  it('renders empty help as empty string', () => {
    expect(renderHelp([])).toBe('');
  });

  it('renders detail with extracted fields', () => {
    const out = renderDetail('app', { id: '1', name: 'Airbnb' }, [field('id'), field('name')]);
    expect(out).toContain('app');
    expect(out).toContain('Airbnb');
    expect(out).toContain('1');
  });

  it('custom field applies a transform function', () => {
    const out = renderList('items', [{ a: 1, b: 2 }], [custom('sum', (i) => (i.a as number) + (i.b as number))]);
    expect(out).toContain('3');
  });

  it('renderError formats error with code and suggestions', () => {
    const out = renderError('not found', 'ERR404', ['try again', 'check input']);
    expect(out).toContain('not found');
    expect(out).toContain('ERR404');
    expect(out).toContain('try again');
    expect(out).toContain('check input');
    expect(out).toContain('help[2]');
  });

  it('renderError handles empty suggestions', () => {
    const out = renderError('fail', 'ERR');
    expect(out).toContain('fail');
    expect(out).toContain('ERR');
    expect(out).not.toContain('help');
  });

  it('renderOutput joins non-empty blocks', () => {
    const out = renderOutput(['a', '', 'b', '']);
    expect(out).toBe('a\nb');
  });

  it('renderOutput returns empty string for all-empty', () => {
    expect(renderOutput(['', ''])).toBe('');
  });

  it('renderList with an alias renames the key in output', () => {
    const out = renderList('items', [{ x: 'val' }], [field('x', 'display')]);
    expect(out).not.toContain('x:');
    expect(out).toContain('display');
  });

  it('pluck handles missing nested value gracefully', () => {
    const out = renderList('items', [{ a: {} }], [pluck('a', 'b', 'name')]);
    // Should not throw, still produce output
    expect(out).toContain('items');
  });
});

describe('truncate', () => {
  it('cuts long text and adds a hint unless full', () => {
    expect(truncate('abcdef', 3, false)).toMatch(/abc.*\+3/);
    expect(truncate('abcdef', 3, true)).toBe('abcdef');
  });

  it('does not truncate text within limit', () => {
    expect(truncate('hi', 10, false)).toBe('hi');
  });

  it('returns full text when full flag is true regardless of length', () => {
    expect(truncate('a very long string', 5, true)).toBe('a very long string');
  });
});
