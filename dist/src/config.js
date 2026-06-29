import { homedir } from 'node:os';
import { join } from 'node:path';
export const MCP_URL = 'https://api.mobbin.com/mcp';
export const TOOLS = {
    quickSearch: 'mobbin_quick_search',
    searchApps: 'mobbin_search_apps',
    searchScreens: 'mobbin_search_screens',
    searchFlows: 'mobbin_search_flows',
    getAppScreens: 'mobbin_get_app_screens',
    getAppFlows: 'mobbin_get_app_flows',
    getScreenDetail: 'mobbin_get_screen_detail',
    getFilters: 'mobbin_get_filters',
    popularApps: 'mobbin_popular_apps',
};
export const CONFIG_DIR = join(homedir(), '.config', 'mobbin-axi');
export const CACHE_DIR = join(homedir(), '.cache', 'mobbin-axi', 'images');
export const CREDENTIALS_PATH = join(CONFIG_DIR, 'credentials.json');
//# sourceMappingURL=config.js.map