import { describe, it, expect } from 'vitest';
import { mapFlows } from '../../src/tools/flows.js';

describe('mapFlows', () => {
  it('returns definitive empty state for 0 results', () => {
    const empty = mapFlows({ flows: [] }, { platform: undefined } as any);
    expect(empty.blocks).toContain('0 results');
    expect(empty.blocks).toHaveLength(1);
    expect(empty.suggestion.domain).toBe('flows');
    expect(empty.suggestion.isEmpty).toBe(true);
  });

  it('renders real fields (id, app_name, name, screen_count) with count', () => {
    const filled = mapFlows(
      {
        flows: [
          {
            id: 'f1',
            name: 'Onboarding Flow',
            actions: ['tap', 'swipe'],
            app_name: 'Spotify',
            screen_count: 4,
            mobbin_url: 'https://mobbin.com/flows/f1',
            platform: 'ios',
          },
        ],
      },
      { platform: undefined } as any,
    );
    const output = filled.blocks.join('\n');
    expect(output).toContain('Spotify');
    expect(output).toContain('Onboarding Flow');
    expect(output).toContain('1 result');
    expect(output).toContain('f1');
    expect(output).toContain('4');
    expect(output).toContain('screens');
    expect(filled.suggestion.domain).toBe('flows');
    expect(filled.suggestion.isEmpty).toBe(false);
  });

  it('handles missing flows key gracefully (empty)', () => {
    const result = mapFlows({} as any, { platform: undefined } as any);
    expect(result.blocks).toContain('0 results');
    expect(result.suggestion.isEmpty).toBe(true);
  });

  it('pluralises header for multiple results', () => {
    const result = mapFlows(
      { flows: [{ id: 'a', name: '', app_name: '', screen_count: 0 }, { id: 'b', name: '', app_name: '', screen_count: 0 }] },
      {} as any,
    );
    expect(result.blocks[0]).toBe('2 results');
  });
});
