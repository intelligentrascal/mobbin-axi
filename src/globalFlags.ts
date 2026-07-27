import { AxiError } from 'axi-sdk-js';

export interface GlobalFlags {
  platform?: 'ios' | 'web';
  limit?: number;
  full: boolean;
  json: boolean;
  download: boolean;
  type?: string;
}

function optionValue(option: string, value: string | undefined): string | undefined {
  if (value?.startsWith('-')) {
    throw new AxiError(`Invalid value for ${option}: ${value}`, 'VALIDATION_ERROR', [
      `${option} requires a value that does not start with -`,
    ]);
  }
  return value;
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
    else if (a === '--platform') flags.platform = optionValue('--platform', args[++i]) as GlobalFlags['platform'];
    else if (eq('--platform') !== undefined) flags.platform = optionValue('--platform', eq('--platform')) as GlobalFlags['platform'];
    else if (a === '--limit') {
      const val = optionValue('--limit', args[++i]);
      if (val !== undefined && val !== '') flags.limit = Number(val);
    }
    else if (eq('--limit') !== undefined) {
      const v = optionValue('--limit', eq('--limit'))!;
      if (v !== '') flags.limit = Number(v);
    }
    else if (a === '--type') flags.type = optionValue('--type', args[++i]);
    else if (eq('--type') !== undefined) flags.type = optionValue('--type', eq('--type'));
    else if (a.startsWith('-')) {
      throw new AxiError(`Unknown flag: ${a}`, 'VALIDATION_ERROR', [
        `Remove ${a} or use a supported flag`,
      ]);
    }
    else rest.push(a);
  }
  if (flags.limit !== undefined && !Number.isFinite(flags.limit)) {
    flags.limit = undefined;
  }
  return { flags, rest };
}
