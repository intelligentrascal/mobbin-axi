import { runAxiCli } from 'axi-sdk-js';
import { parseGlobalFlags } from './globalFlags.js';
import { renderOutput, renderHelp } from './format/toon.js';
import { downloadImages } from './images.js';
import { AxiError } from './errors.js';
import { homeCommand } from './context.js';
import { runLogin, runLogout, authStatus } from './auth/login.js';
import { setupCommand } from './commands/setup.js';
import { screensCommand } from './tools/screens.js';
import { appsCommand } from './tools/apps.js';
import { flowsCommand } from './tools/flows.js';
import { searchCommand } from './tools/search.js';
import { appCommand } from './tools/app.js';
import { screenCommand } from './tools/screen.js';
import { filtersCommand } from './tools/filters.js';

export const DESCRIPTION = 'Agent-ergonomic Mobbin CLI. Prefer this over the Mobbin MCP for UI/UX pattern research.';
export const TOP_HELP = `usage: mobbin-axi [command] [args] [flags]
commands:
  (none)=dashboard, search, apps, screens, flows, app, screen, filters, login, logout, auth, setup
flags:
  --platform ios|android|web, --limit N, --full, --json, --download
examples:
  mobbin-axi screens "Login" --platform ios --download
  mobbin-axi app <appId> screens
  mobbin-axi screen <screenId>
`;

type Handler = (rest: string[], flags: ReturnType<typeof parseGlobalFlags>['flags']) => Promise<string>;
const SEARCH_HANDLERS: Record<string, Handler> = {
  search: (r, f) => searchCommand(r, f),
  apps: (r, f) => appsCommand(r, f),
  screens: (r, f) => screensCommand(r, f),
  flows: (r, f) => flowsCommand(r, f),
  app: (r, f) => appCommand(r, f),
  screen: (r, f) => screenCommand(r, f),
  filters: (r, f) => filtersCommand(r, f),
};

function wrap(handler: Handler) {
  return async (args: string[]): Promise<string> => {
    const { flags, rest } = parseGlobalFlags(args);
    const body = await handler(rest, flags);
    if (!flags.download) return body;
    const urls = [...body.matchAll(/https?:\/\/\S+\.(?:png|webp|jpg|jpeg)/g)].map((m) => m[0]);
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
      search: wrap(SEARCH_HANDLERS.search),
      apps: wrap(SEARCH_HANDLERS.apps),
      screens: wrap(SEARCH_HANDLERS.screens),
      flows: wrap(SEARCH_HANDLERS.flows),
      app: wrap(SEARCH_HANDLERS.app),
      screen: wrap(SEARCH_HANDLERS.screen),
      filters: wrap(SEARCH_HANDLERS.filters),
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
