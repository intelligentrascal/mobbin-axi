import { AxiError, installSessionStartHooks } from 'axi-sdk-js';
import { renderHelp, renderOutput } from '../format/toon.js';

export const SETUP_HELP = `usage: mobbin-axi setup hooks
Install or repair agent SessionStart hooks for mobbin-axi ambient context.

examples:
  mobbin-axi setup hooks
`;

export async function setupCommand(args: string[]): Promise<string> {
  if (args.length !== 1 || args[0] !== 'hooks') {
    throw new AxiError('Unknown setup action', 'VALIDATION_ERROR', [
      'Run `mobbin-axi setup hooks`',
    ]);
  }
  installSessionStartHooks();
  return renderOutput([
    'hooks:\n  status: installed\n  integrations: Claude Code, Codex, OpenCode',
    renderHelp([
      'Restart your agent session to receive mobbin-axi ambient context',
    ]),
  ]);
}
