export interface GlobalFlags {
    platform?: 'ios' | 'web';
    limit?: number;
    full: boolean;
    json: boolean;
    download: boolean;
    popular: boolean;
    type?: string;
}
export declare function parseGlobalFlags(args: string[]): {
    flags: GlobalFlags;
    rest: string[];
};
