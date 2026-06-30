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
export declare function mapScreens(result: {
    screens?: unknown[];
}, _flags: GlobalFlags): ToolResult;
export declare function screensCommand(args: string[], flags: GlobalFlags): Promise<string>;
