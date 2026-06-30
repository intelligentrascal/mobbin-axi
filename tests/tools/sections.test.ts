import { describe, it, expect } from 'vitest';
import { mapSections } from '../../src/tools/sections.js';

describe('mapSections', () => {
  it('returns definitive empty state for 0 results', () => {
    const empty = mapSections({ sections: [] }, { platform: undefined } as any);
    expect(empty.blocks).toContain('0 results');
    expect(empty.blocks).toHaveLength(1);
    expect(empty.suggestion.domain).toBe('sections');
    expect(empty.suggestion.isEmpty).toBe(true);
  });

  it('renders real fields (id, site_name, image_url) with count', () => {
    const filled = mapSections(
      {
        sections: [
          {
            id: 'sec1',
            image_url: 'https://mobbin.com/api/mcp/short/xyz',
            mobbin_url: 'https://mobbin.com/sections/xyz',
            site_name: 'Stripe',
          },
        ],
      },
      { platform: undefined } as any,
    );
    const output = filled.blocks.join('\n');
    expect(output).toContain('Stripe');
    expect(output).toContain('1 result');
    expect(output).toContain('sec1');
    expect(output).toContain('https://mobbin.com/api/mcp/short/xyz');
    expect(filled.suggestion.domain).toBe('sections');
    expect(filled.suggestion.isEmpty).toBe(false);
  });

  it('handles missing sections key gracefully (empty)', () => {
    const result = mapSections({} as any, { platform: undefined } as any);
    expect(result.blocks).toContain('0 results');
    expect(result.suggestion.isEmpty).toBe(true);
  });

  it('pluralises header for multiple results', () => {
    const result = mapSections(
      { sections: [{ id: 'a', image_url: '', site_name: '' }, { id: 'b', image_url: '', site_name: '' }] },
      {} as any,
    );
    expect(result.blocks[0]).toBe('2 results');
  });
});
