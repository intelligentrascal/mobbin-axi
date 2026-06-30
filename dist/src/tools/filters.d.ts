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
export declare function mapFilters(result: Record<string, unknown>, _flags: GlobalFlags): ToolResult;
export declare function filtersCommand(_args: string[], flags: GlobalFlags): Promise<string>;
