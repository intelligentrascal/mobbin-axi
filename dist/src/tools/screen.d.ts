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
export declare function mapScreen(result: Record<string, unknown> | null | undefined, _flags: GlobalFlags): ToolResult;
export declare function screenCommand(args: string[], flags: GlobalFlags): Promise<string>;
