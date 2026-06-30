export interface SuggestionCtx {
    domain: string;
    action: string;
    isEmpty: boolean;
    id?: string;
}
export interface ToolResult {
    blocks: string[];
    suggestion: SuggestionCtx;
}
