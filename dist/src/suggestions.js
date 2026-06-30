const table = [
    {
        match: (_c) => _c.domain === 'home',
        lines: () => [
            'Run `mobbin-axi search "<query>"` or `mobbin-axi screens "Login"`',
        ],
    },
    {
        match: (c) => c.domain === 'screens' && !c.isEmpty,
        lines: () => [
            'Run `mobbin-axi screen <id>` for full detail',
            'Add `--download` to fetch the screenshots as local files',
        ],
    },
    {
        match: (c) => c.domain === 'screens' && c.isEmpty,
        lines: () => [
            'Try a broader term or run `mobbin-axi filters` to see valid patterns',
        ],
    },
    {
        match: (c) => c.domain === 'apps' && !c.isEmpty,
        lines: () => [
            "Run `mobbin-axi app <appId> screens` to see an app's screens",
        ],
    },
    {
        match: (c) => c.domain === 'flows' && !c.isEmpty,
        lines: () => [
            "Run `mobbin-axi screen <id>` to inspect a flow's screens",
        ],
    },
    {
        match: (c) => c.domain === 'screen',
        lines: () => ['Add `--download` to fetch this screenshot locally'],
    },
];
export function getSuggestions(ctx) {
    for (const e of table)
        if (e.match(ctx))
            return e.lines(ctx);
    return [];
}
//# sourceMappingURL=suggestions.js.map