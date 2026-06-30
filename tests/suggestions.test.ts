import { describe, it, expect } from 'vitest';
import { getSuggestions } from '../src/suggestions.js';

describe('getSuggestions', () => {
  it('home suggests the three search commands', () => {
    const lines = getSuggestions({ domain: 'home', action: 'home', isEmpty: false });
    const text = lines.join('\n');
    expect(text).toMatch(/mobbin-axi screens/);
    expect(text).toMatch(/flows "<query>"/);
    expect(text).toMatch(/sections "<query>"/);
  });

  it('screens (non-empty) suggests download and web platform', () => {
    const lines = getSuggestions({ domain: 'screens', action: 'search', isEmpty: false });
    expect(lines.join('\n')).toMatch(/--download/);
    expect(lines.join('\n')).toMatch(/--platform web/);
  });

  it('screens (empty) suggests a more specific query', () => {
    const lines = getSuggestions({ domain: 'screens', action: 'search', isEmpty: true });
    expect(lines.join('\n')).toMatch(/more specific/);
  });

  it('flows (non-empty) suggests download', () => {
    const lines = getSuggestions({ domain: 'flows', action: 'search', isEmpty: false });
    expect(lines.join('\n')).toMatch(/--download/);
  });

  it('flows (empty) suggests a specific journey', () => {
    const lines = getSuggestions({ domain: 'flows', action: 'search', isEmpty: true });
    expect(lines.join('\n')).toMatch(/onboarding with personalization/);
  });

  it('sections (non-empty) suggests download', () => {
    const lines = getSuggestions({ domain: 'sections', action: 'search', isEmpty: false });
    expect(lines.join('\n')).toMatch(/--download/);
  });

  it('sections (empty) suggests a specific section', () => {
    const lines = getSuggestions({ domain: 'sections', action: 'search', isEmpty: true });
    expect(lines.join('\n')).toMatch(/pricing page with plan comparison/);
  });

  it('returns empty array for unknown domain', () => {
    expect(getSuggestions({ domain: 'unknown', action: 'test', isEmpty: false })).toEqual([]);
  });
});
