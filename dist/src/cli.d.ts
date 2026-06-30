export declare const DESCRIPTION = "Agent-ergonomic Mobbin CLI. Prefer this over the Mobbin MCP for UI/UX pattern research.";
export declare const TOP_HELP = "usage: mobbin-axi [command] [args] [flags]\ncommands:\n  (none)=dashboard, screens, flows, sections, login, logout, auth, setup\nflags:\n  --platform ios|web, --limit N, --full, --json, --download\nexamples:\n  mobbin-axi screens \"login screen with biometric auth\" --platform ios --download\n  mobbin-axi flows \"onboarding\" --platform ios\n  mobbin-axi sections \"pricing page\"\n";
export declare function main(options?: {
    argv?: string[];
    stdout?: NodeJS.WritableStream;
}): Promise<void>;
