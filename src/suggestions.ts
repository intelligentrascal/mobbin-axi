import type { SuggestionCtx } from './tools/types.js';

const table: Array<{
  match: (c: SuggestionCtx) => boolean;
  lines: (c: SuggestionCtx) => string[];
}> = [
  {
    match: (_c) => _c.domain === 'home',
    lines: () => [
      'Run `mobbin-axi screens "<query>" --platform ios`, `flows "<query>"`, or `sections "<query>"`',
    ],
  },
  {
    match: (c) => c.domain === 'screens' && !c.isEmpty,
    lines: () => [
      "Open a result's mobbin_url, or add `--download` to fetch the screenshots",
      'Try `--platform web` for website UIs',
    ],
  },
  {
    match: (c) => c.domain === 'screens' && c.isEmpty,
    lines: () => [
      'Try a more specific, single-screen description (e.g. "checkout with Apple Pay")',
    ],
  },
  {
    match: (c) => c.domain === 'flows' && !c.isEmpty,
    lines: () => [
      'Add `--download` to fetch the flow\'s screen images',
    ],
  },
  {
    match: (c) => c.domain === 'flows' && c.isEmpty,
    lines: () => [
      'Try describing one user journey, e.g. "onboarding with personalization"',
    ],
  },
  {
    match: (c) => c.domain === 'sections' && !c.isEmpty,
    lines: () => [
      'Add `--download` to fetch the section images',
    ],
  },
  {
    match: (c) => c.domain === 'sections' && c.isEmpty,
    lines: () => [
      'Try a single website section, e.g. "pricing page with plan comparison"',
    ],
  },
];

export function getSuggestions(ctx: SuggestionCtx): string[] {
  for (const e of table) if (e.match(ctx)) return e.lines(ctx);
  return [];
}
