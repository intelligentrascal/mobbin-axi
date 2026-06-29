export interface GlobalFlags {
  platform?: 'ios' | 'android' | 'web';
  limit?: number;
  full: boolean;
  json: boolean;
  download: boolean;
  popular: boolean;
  type?: string;
}

export function parseGlobalFlags(args: string[]): { flags: GlobalFlags; rest: string[] } {
  const flags: GlobalFlags = { full: false, json: false, download: false, popular: false };
  const rest: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const eq = (p: string) => (a.startsWith(p + '=') ? a.slice(p.length + 1) : undefined);
    if (a === '--full') flags.full = true;
    else if (a === '--json') flags.json = true;
    else if (a === '--download') flags.download = true;
    else if (a === '--popular') flags.popular = true;
    else if (a === '--platform') flags.platform = args[++i] as GlobalFlags['platform'];
    else if (eq('--platform')) flags.platform = eq('--platform') as GlobalFlags['platform'];
    else if (a === '--limit') {
      const val = args[++i];
      if (val !== undefined && !val.startsWith('--')) flags.limit = Number(val);
      else { i--; /* put back */ }
    }
    else if (eq('--limit')) flags.limit = Number(eq('--limit'));
    else if (a === '--type') flags.type = args[++i];
    else if (eq('--type')) flags.type = eq('--type');
    else rest.push(a);
  }
  if (flags.limit !== undefined && !Number.isFinite(flags.limit)) {
    flags.limit = undefined;
  }
  return { flags, rest };
}
