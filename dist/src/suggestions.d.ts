export interface SuggestionCtx {
    domain: string;
    action: string;
    isEmpty: boolean;
    id?: string;
}
export declare function getSuggestions(ctx: SuggestionCtx): string[];
