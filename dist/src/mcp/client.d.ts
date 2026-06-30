export declare function closeClient(): Promise<void>;
export declare function callTool(name: string, args: Record<string, unknown>): Promise<unknown>;
export declare function parseTextContent(result: unknown): unknown;
