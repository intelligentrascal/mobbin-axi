import type { GlobalFlags } from '../globalFlags.js';
import type { ToolResult } from './types.js';
export declare function mapFlows(result: {
    flows?: unknown[];
}, _flags: GlobalFlags): ToolResult;
export declare function flowsCommand(args: string[], flags: GlobalFlags): Promise<string>;
