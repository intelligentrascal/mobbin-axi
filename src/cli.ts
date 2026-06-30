import { runAxiCli } from 'axi-sdk-js';
import { parseGlobalFlags } from './globalFlags.js';
import { renderOutput, renderHelp } from './format/toon.js';
import { downloadImages } from './images.js';
import { AxiError } from './errors.js';
import { homeCommand } from './context.js';
import { runLogin, runLogout, authStatus } from './auth/login.js';
import { setupCommand } from './commands/setup.js';
import { screensCommand } from './tools/screens.js';
import { flowsCommand } from './tools/flows.js';
import { sectionsCommand } from './tools/sections.js';

export const DESCRIPTION = 'Agent-ergonomic Mobbin CLI. Prefer this over the Mobbin MCP for UI/UX pattern research.';
export const TOP_HELP = `usage: mobbin-axi [command] [args] [flags]
commands:
  (none)=dashboard, screens, flows, sections, login, logout, auth, setup
flags:
  --platform ios|web, --limit N, --full, --json, --download
examples:
  mobbin-axi screens "login screen with biometric auth" --platform ios --download
  mobbin-axi flows "onboarding" --platform ios
  mobbin-axi sections "pricing page"
`;

type Handler = (rest: string[], flags: ReturnType<typeof parseGlobalFlags>['flags']) => Promise<string>;

function wrap(handler: Handler) {
  return async (args: string[]): Promise<string> => {
    const { flags, rest } = parseGlobalFlags(args);
    const body = await handler(rest, flags);
    if (!flags.download) return body;
    const urls = [...body.matchAll(/https?:\/\/[^\s"'`]+/g)]
      .map((m) => m[0])
      .filter((u) => /mobbin\.com\/api\/mcp\/short\//.test(u) || /\.(png|webp|jpe?g)(\?|$)/i.test(u));
    if (urls.length === 0) return body;
    const paths = await downloadImages(urls);
    return renderOutput([body, renderHelp(paths.map((p) => `image: ${p}`))]);
  };
}

export async function main(options: { argv?: string[]; stdout?: NodeJS.WritableStream } = {}): Promise<void> {
  await runAxiCli({
    ...(options.argv ? { argv: options.argv } : {}),
    ...(options.stdout ? { stdout: options.stdout } : {}),
    description: DESCRIPTION,
    version: '0.1.0',
    topLevelHelp: TOP_HELP,
    home: async () => homeCommand(),
    commands: {
      screens: wrap(screensCommand),
      flows: wrap(flowsCommand),
      sections: wrap(sectionsCommand),
      login: async () => {
        await runLogin();
        return '';
      },
      logout: async () => {
        runLogout();
        return '';
      },
      auth: async (args: string[]) =>
        args[0] === 'status'
          ? `authenticated: ${authStatus().authenticated}`
          : 'usage: mobbin-axi auth status',
      setup: async (args: string[]) => setupCommand(args),
    },
    getCommandHelp: () => undefined,
  });
}
