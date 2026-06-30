import { describe, it, expect } from 'vitest';
import { mapScreens } from '../../src/tools/screens.js';

describe('mapScreens', () => {
  it('renders 3-4 fields and a count, with a definitive empty state', () => {
    const empty = mapScreens({ screens: [] }, { platform: undefined } as any);
    expect(empty.blocks.join('\n')).not.toContain('(0 results)');
    expect(empty.blocks).toContain('0 results');
    const filled = mapScreens(
      { screens: [{ id: 's1', screenUrl: 'http://img/1.png', pattern: 'Login', appName: 'Airbnb' }] },
      { platform: undefined } as any,
    );
    expect(filled.blocks.join('\n')).toContain('Airbnb');
    expect(filled.blocks.join('\n')).toContain('1 result');
    expect(filled.suggestion.domain).toBe('screens');
  });
});
