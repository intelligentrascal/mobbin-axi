export declare function parseCallback(callbackUrl: string, expectedState: string): URLSearchParams;
export declare function runLogin(): Promise<void>;
export declare function runLogout(): void;
export declare function authStatus(): {
    authenticated: boolean;
};
