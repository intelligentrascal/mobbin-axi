import type { GlobalFlags } from '../globalFlags.js';
import type { ToolResult } from './types.js';
export declare function mapScreens(result: {
    screens?: unknown[];
}, _flags: GlobalFlags): ToolResult;
export declare function screensCommand(args: string[], flags: GlobalFlags): Promise<string>;
