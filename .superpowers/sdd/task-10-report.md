# Task 10: Fix silent image fetch failures

## Changes

### `src/images.ts`
- Wrapped `fetchImpl` call in try/catch so one bad URL never aborts the batch.
- On `!res.ok` (404/500/etc.), writes a one-line warning to `process.stderr` with status code and URL, then `continue`s (skips the failed URL).
- On a thrown fetch error, writes a one-line warning to `process.stderr` with error message and URL, then `continue`s.
- Return type remains `Promise<string[]>` — only successful paths are returned. Stdout is kept clean for TOON output.

### `tests/images.test.ts`
- Added test: `skips failed fetches (ok=false) and writes stderr warning, returning only successful paths`
  - Verifies that a mix of one ok and one non-ok URL produces only the successful path.
  - Verifies both URLs were attempted (fetchCalls === 2).
  - Spies on `process.stderr.write` to confirm the warning message includes `mobbin-axi: image fetch failed`, `404`, and the bad URL.
- Added test: `does not re-fetch when file already cached (cache hit)`
  - Calls `downloadImages` twice with the same URL, using a counting fetch on the second call.
  - Asserts `fetchCount === 0` on the second call, confirming the cache hit path `existsSync(file)` skips fetch.
- Refactored the dynamic import into a `freshDownloadImages()` helper to avoid repetition.

## Commands run
```sh
npx tsc --noEmit          # clean
npx vitest run tests/images.test.ts  # 3/3 passed
npx vitest run             # 60/60 passed (9 files)
```

## Output
- TypeScript: no emit errors
- `tests/images.test.ts`: 3 passed
- Full suite: 60 passed, 0 failed, 9 test files
