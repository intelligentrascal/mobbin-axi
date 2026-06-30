import type { GlobalFlags } from '../globalFlags.js';
export interface ToolResult {
    blocks: string[];
    suggestion: {
        domain: string;
        action: string;
        isEmpty: boolean;
        id?: string;
    };
}
export declare function mapApps(result: {
    apps?: unknown[];
}, _flags: GlobalFlags): ToolResult;
export declare function appsCommand(args: string[], flags: GlobalFlags): Promise<string>;
