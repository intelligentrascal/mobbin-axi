import type { GlobalFlags } from '../globalFlags.js';
import type { ToolResult } from './types.js';
export declare function mapSections(result: {
    sections?: unknown[];
}, _flags: GlobalFlags): ToolResult;
export declare function sectionsCommand(args: string[], flags: GlobalFlags): Promise<string>;
