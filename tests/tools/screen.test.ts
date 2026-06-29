import { describe, it, expect } from 'vitest';
import { mapScreen } from '../../src/tools/screen.js';

describe('mapScreen', () => {
  it('renders detail fields for a screen', () => {
    const detail = mapScreen(
      { id: 's1', screenUrl: 'http://img/1.png', pattern: 'Login', appName: 'Airbnb' },
      { platform: undefined } as any,
    );
    expect(detail.blocks.join('\n')).toContain('Airbnb');
    expect(detail.blocks.join('\n')).toContain('Login');
    expect(detail.suggestion.domain).toBe('screen');
  });

  it('produces empty state for null/undefined result', () => {
    const empty = mapScreen(null, { platform: undefined } as any);
    expect(empty.blocks.join('\n')).toMatch(/0 results/);
    expect(empty.suggestion.isEmpty).toBe(true);
  });

  it('includes screenUrl as image field', () => {
    const detail = mapScreen(
      { id: 's1', screenUrl: 'http://img/1.png', pattern: 'Login', appName: 'Airbnb' },
      { platform: undefined } as any,
    );
    expect(detail.blocks.join('\n')).toContain('http://img/1.png');
  });
});
