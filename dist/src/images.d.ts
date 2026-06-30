type FetchLike = (url: string) => Promise<{
    ok: boolean;
    arrayBuffer: () => Promise<ArrayBuffer>;
}>;
export declare function downloadImages(urls: string[], fetchImpl?: FetchLike): Promise<string[]>;
export {};
