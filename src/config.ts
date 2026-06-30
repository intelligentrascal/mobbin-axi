import { homedir } from 'node:os';
import { join } from 'node:path';

export const MCP_URL = 'https://api.mobbin.com/mcp';

export const TOOLS = {
  searchScreens: 'search_screens',
  searchFlows: 'search_flows',
  searchSections: 'search_sections',
} as const;

export const CONFIG_DIR = join(homedir(), '.config', 'mobbin-axi');
export const CACHE_DIR = join(homedir(), '.cache', 'mobbin-axi', 'images');
export const CREDENTIALS_PATH = join(CONFIG_DIR, 'credentials.json');
