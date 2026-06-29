import { describe, it, expect } from 'vitest';
import { getSuggestions } from '../src/suggestions.js';

describe('getSuggestions', () => {
  it('suggests drilling into a screen after a screens search', () => {
    const lines = getSuggestions({ domain: 'screens', action: 'search', isEmpty: false });
    expect(lines.join('\n')).toMatch(/mobbin-axi screen/);
  });

  it('suggests broadening when empty', () => {
    expect(getSuggestions({ domain: 'screens', action: 'search', isEmpty: true }).length).toBeGreaterThan(0);
  });
});
