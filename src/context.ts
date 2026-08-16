import { renderHelp, renderOutput } from './format/toon.js';
import { authStatus } from './auth/login.js';
import { getSuggestions } from './suggestions.js';

export async function homeCommand(): Promise<string> {
  const status = authStatus();
  if (!status.authenticated) {
    return renderOutput([
      'mobbin-axi: not authenticated',
      renderHelp(['Run `mobbin-axi login` to authenticate with Mobbin']),
    ]);
  }
  const statusBlock = [
    'authenticated: true',
    'service: Mobbin UI/UX pattern search',
    'commands: screens, flows, sections',
    'platforms: ios, web',
  ].join('\n');
  return renderOutput([
    statusBlock,
    renderHelp(getSuggestions({ domain: 'home', action: 'home', isEmpty: false })),
  ]);
}
