import { describe, it, expect } from 'vitest';
import { mapScreens } from '../../src/tools/screens.js';

describe('mapScreens', () => {
  it('returns definitive empty state for 0 results', () => {
    const empty = mapScreens({ screens: [] }, { platform: undefined } as any);
    expect(empty.blocks).toContain('0 results');
    expect(empty.blocks).toHaveLength(1);
    expect(empty.suggestion.domain).toBe('screens');
    expect(empty.suggestion.isEmpty).toBe(true);
  });

  it('renders real fields (id, app_name, platform, image_url) with count', () => {
    const filled = mapScreens(
      {
        screens: [
          {
            id: 's1',
            image_url: 'https://mobbin.com/api/mcp/short/abc123',
            mobbin_url: 'https://mobbin.com/screens/abc123',
            app_name: 'Airbnb',
            platform: 'ios',
          },
        ],
      },
      { platform: undefined } as any,
    );
    const output = filled.blocks.join('\n');
    expect(output).toContain('Airbnb');
    expect(output).toContain('1 result');
    expect(output).toContain('s1');
    expect(output).toContain('ios');
    expect(filled.suggestion.domain).toBe('screens');
    expect(filled.suggestion.isEmpty).toBe(false);
  });

  it('handles missing screens key gracefully (empty)', () => {
    const result = mapScreens({} as any, { platform: undefined } as any);
    expect(result.blocks).toContain('0 results');
    expect(result.suggestion.isEmpty).toBe(true);
  });

  it('pluralises header for multiple results', () => {
    const result = mapScreens(
      { screens: [{ id: 'a', image_url: '', app_name: '', platform: 'ios' }, { id: 'b', image_url: '', app_name: '', platform: 'web' }] },
      {} as any,
    );
    expect(result.blocks[0]).toBe('2 results');
  });
});
