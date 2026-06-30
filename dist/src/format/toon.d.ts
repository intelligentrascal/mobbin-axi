export type FieldDef = {
    type: 'field';
    key: string;
    as?: string;
} | {
    type: 'pluck';
    key: string;
    subkey: string;
    as?: string;
} | {
    type: 'custom';
    as: string;
    fn: (item: Record<string, unknown>) => unknown;
};
export declare const field: (key: string, as?: string) => FieldDef;
export declare const pluck: (key: string, subkey: string, as?: string) => FieldDef;
export declare const custom: (as: string, fn: (i: Record<string, unknown>) => unknown) => FieldDef;
export declare function renderList(label: string, items: Record<string, unknown>[], schema: FieldDef[]): string;
export declare function renderDetail(label: string, item: Record<string, unknown>, schema: FieldDef[]): string;
export declare function renderHelp(lines: string[]): string;
export declare function renderError(message: string, code: string, suggestions?: string[]): string;
export declare function renderOutput(blocks: string[]): string;
