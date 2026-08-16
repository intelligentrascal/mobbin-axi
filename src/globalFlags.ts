import { AxiError } from './errors.js';

export interface GlobalFlags {
  platform?: 'ios' | 'web';
  limit?: number;
  full: boolean;
  json: boolean;
  download: boolean;
}

export function parseGlobalFlags(args: string[]): { flags: GlobalFlags; rest: string[] } {
  const flags: GlobalFlags = { full: false, json: false, download: false };
  const rest: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const eq = (p: string) => (a.startsWith(p + '=') ? a.slice(p.length + 1) : undefined);

    if (a === '--full') flags.full = true;
    else if (a === '--json') flags.json = true;
    else if (a === '--download') flags.download = true;

    else if (a === '--platform' || eq('--platform') !== undefined) {
      const val = a === '--platform' ? args[++i] : eq('--platform')!;
      if (val !== 'ios' && val !== 'web') {
        throw new AxiError(
          `--platform must be "ios" or "web", got "${val ?? ''}"`,
          'VALIDATION_ERROR',
          ['e.g., mobbin-axi screens "login" --platform ios'],
        );
      }
      flags.platform = val as 'ios' | 'web';
    }

    else if (a === '--limit' || eq('--limit') !== undefined) {
      const raw = a === '--limit' ? args[++i] : eq('--limit')!;
      if (raw === undefined || raw === '' || raw.startsWith('--')) {
        if (a === '--limit') i--; // put back next token
        throw new AxiError('--limit requires a positive integer value', 'VALIDATION_ERROR', ['e.g., --limit 10']);
      }
      const n = Number(raw);
      if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
        throw new AxiError(
          `--limit must be a positive integer, got "${raw}"`,
          'VALIDATION_ERROR',
          ['e.g., --limit 10'],
        );
      }
      flags.limit = n;
    }

    else if (a === '--type' || eq('--type') !== undefined) {
      // --type is not a supported flag in any search command
      if (a === '--type') i++; // consume the value token so it isn't treated as a positional
      throw new AxiError(
        '--type is not a recognized flag',
        'VALIDATION_ERROR',
        ['Supported flags: --platform ios|web, --limit N, --full, --json, --download'],
      );
    }

    else rest.push(a);
  }
  return { flags, rest };
}
