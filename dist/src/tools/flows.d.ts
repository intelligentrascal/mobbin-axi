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
export declare function mapFlows(result: {
    flows?: unknown[];
}, _flags: GlobalFlags): ToolResult;
export declare function flowsCommand(args: string[], flags: GlobalFlags): Promise<string>;
