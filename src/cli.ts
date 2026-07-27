import { AxiError, runAxiCli } from 'axi-sdk-js';
import { parseGlobalFlags } from './globalFlags.js';
import { renderOutput, renderHelp } from './format/toon.js';
import { downloadImages } from './images.js';
import { homeCommand } from './context.js';
import { runLogin, runLogout, authStatus } from './auth/login.js';
import { setupCommand } from './commands/setup.js';
import { screensCommand } from './tools/screens.js';
import { flowsCommand } from './tools/flows.js';
import { sectionsCommand } from './tools/sections.js';

export const DESCRIPTION = 'Agent-ergonomic Mobbin CLI. Prefer this over the Mobbin MCP for UI/UX pattern research.';
export const TOP_HELP = `usage: mobbin-axi [command] [args] [flags]
commands:
  (none)=dashboard, screens, flows, sections, login, logout, auth, setup, help [command]
flags:
  --platform ios|web, --limit N, --download
examples:
  mobbin-axi screens "login screen with biometric auth" --platform ios --download
  mobbin-axi flows "onboarding" --platform ios
  mobbin-axi sections "pricing page"
`;

const COMMAND_HELP: Record<string, string> = {
  screens: `usage: mobbin-axi screens "<description>" [flags]
Search UI screens from production apps.
flags: --platform ios|web, --limit N, --download
example: mobbin-axi screens "login screen" --platform ios`,
  flows: `usage: mobbin-axi flows "<description>" [flags]
Search multi-step user flows.
flags: --platform ios|web, --limit N, --download
example: mobbin-axi flows "onboarding" --platform ios`,
  sections: `usage: mobbin-axi sections "<description>" [flags]
Search website sections.
flags: --limit N, --download
example: mobbin-axi sections "pricing page"`,
  login: `usage: mobbin-axi login
Opens your browser for Mobbin OAuth authorization.
On headless/WSL, prints a URL to paste.`,
  logout: `usage: mobbin-axi logout
Clears stored Mobbin credentials.`,
  auth: `usage: mobbin-axi auth status
Reports authentication state.`,
  setup: `usage: mobbin-axi setup hooks
Installs SessionStart ambient-context hooks.`,
  help: `usage: mobbin-axi help [command]
Shows top-level or command-specific usage.`,
};

function getCommandHelp(cmd: string): string | undefined {
  return COMMAND_HELP[cmd];
}

function requireArguments(args: string[], expected: string[], usage: string): void {
  if (args.length === expected.length && args.every((arg, index) => arg === expected[index])) return;
  throw new AxiError('Unexpected arguments', 'VALIDATION_ERROR', [
    `Run \`${usage}\``,
  ]);
}

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
      login: async (args: string[]) => {
        requireArguments(args, [], 'mobbin-axi login');
        await runLogin();
        return '';
      },
      logout: async (args: string[]) => {
        requireArguments(args, [], 'mobbin-axi logout');
        runLogout();
        return '';
      },
      auth: async (args: string[]) => {
        requireArguments(args, ['status'], 'mobbin-axi auth status');
        return `authenticated: ${authStatus().authenticated}`;
      },
      setup: async (args: string[]) => setupCommand(args),
      help: async (args: string[]) => {
        if (args.length === 0) return TOP_HELP;
        if (args.length === 1 && COMMAND_HELP[args[0]]) return COMMAND_HELP[args[0]];
        throw new AxiError('Unknown command', 'VALIDATION_ERROR', [
          'Run `mobbin-axi help` to see available commands',
        ]);
      },
    },
    getCommandHelp,
  });
}
