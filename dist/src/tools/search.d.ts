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
export declare function mapSearch(result: Record<string, unknown>, _flags: GlobalFlags): ToolResult;
export declare function searchCommand(args: string[], flags: GlobalFlags): Promise<string>;
