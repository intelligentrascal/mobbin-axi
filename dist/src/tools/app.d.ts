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
export declare function mapApp(result: Record<string, unknown>, _flags: GlobalFlags, subcommand: 'screens' | 'flows'): ToolResult;
export declare function appCommand(args: string[], flags: GlobalFlags): Promise<string>;
