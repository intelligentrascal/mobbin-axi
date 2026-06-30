export declare const DESCRIPTION = "Agent-ergonomic Mobbin CLI. Prefer this over the Mobbin MCP for UI/UX pattern research.";
export declare const TOP_HELP = "usage: mobbin-axi [command] [args] [flags]\ncommands:\n  (none)=dashboard, search, apps, screens, flows, app, screen, filters, login, logout, auth, setup\nflags:\n  --platform ios|android|web, --limit N, --full, --json, --download\nexamples:\n  mobbin-axi screens \"Login\" --platform ios --download\n  mobbin-axi app <appId> screens\n  mobbin-axi screen <screenId>\n";
export declare function main(options?: {
    argv?: string[];
    stdout?: NodeJS.WritableStream;
}): Promise<void>;
