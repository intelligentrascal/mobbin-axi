import { describe, it, expect } from 'vitest';
import { mapApps } from '../../src/tools/apps.js';

describe('mapApps', () => {
  it('renders fields and a count, with definitive empty state', () => {
    const empty = mapApps({ apps: [] }, { platform: undefined } as any);
    expect(empty.blocks.join('\n')).toMatch(/0 results/);

    const filled = mapApps(
      {
        apps: [{ id: 'a1', appName: 'Airbnb', appTagline: 'Travel', appLogoUrl: 'http://logo.png' }],
      },
      { platform: undefined } as any,
    );
    expect(filled.blocks.join('\n')).toContain('Airbnb');
    expect(filled.blocks.join('\n')).toContain('1 result');
    expect(filled.suggestion.domain).toBe('apps');
  });

  it('handles plural results correctly', () => {
    const filled = mapApps(
      {
        apps: [
          { id: 'a1', appName: 'A', appTagline: 'T', appLogoUrl: '' },
          { id: 'a2', appName: 'B', appTagline: 'U', appLogoUrl: '' },
        ],
      },
      { platform: undefined } as any,
    );
    expect(filled.blocks.join('\n')).toContain('2 results');
    expect(filled.blocks.join('\n')).toContain('A');
    expect(filled.blocks.join('\n')).toContain('B');
  });
});
