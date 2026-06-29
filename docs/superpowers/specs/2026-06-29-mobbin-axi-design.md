# mobbin-axi — Design Spec

Date: 2026-06-29
Status: Approved (design); ready for implementation planning

## 1. Purpose

`mobbin-axi` is an [AXI](https://github.com/kunchenguid/axi)-compliant CLI that wraps
Mobbin's OAuth-gated hosted MCP server and exposes its tools as token-efficient,
content-first shell commands. It exists because Mobbin's MCP is awkward for agents to
use directly; an AXI gives cleaner output, fewer tokens, fewer round trips, and
graceful errors — the same pattern `otter-axi` uses to wrap a hosted MCP as a
scriptable headless CLI.

### Consumers

- **Primary:** the opencode `frontend-designer` agent, which queries Mobbin during the
  DESIGN phase to ground UI/UX directions in real production patterns.
- **Secondary:** any agent on any machine via `npx -y mobbin-axi …`.

### Distribution

Published to npm as `mobbin-axi`, with a bundled Agent Skill installable via
`npx skills add`. Follows the 10 AXI design principles.

## 2. Key decisions

| Decision | Choice | Rationale |
|---|---|---|
| Backend | Wrap Mobbin's existing hosted MCP (do not reverse-engineer the private web API or drive a browser) | Lowest risk; cleans up the "iffy" MCP; precedent in `otter-axi` |
| Images | Image URLs in output by default; `--download` fetches PNGs to a local cache and prints paths | Lets a design agent actually *see* patterns; lazy so it doesn't burn tokens/disk by default |
| Auth | **OAuth only** — self-contained `mobbin-axi login` (no token-paste or opencode-token fallback) | Cleanest UX; truly standalone and publishable |
| Build/ship | Build in TypeScript and publish to npm + bundled skill | Reusable anywhere; shareable to the AXI community catalog |

## 3. Findings (from investigation)

- **MCP endpoint:** `https://api.mobbin.com/mcp`, transport `http` (Streamable HTTP).
  Configured in `~/.config/opencode/opencode.jsonc` with no token.
- **Tools (9):** `mobbin_quick_search`, `mobbin_search_apps`, `mobbin_search_screens`,
  `mobbin_search_flows`, `mobbin_get_app_screens`, `mobbin_get_app_flows`,
  `mobbin_get_screen_detail`, `mobbin_get_filters`, `mobbin_popular_apps`.
- **Auth posture:** an MCP `initialize` POST returns `401` with
  `WWW-Authenticate: Bearer resource_metadata="https://api.mobbin.com/.well-known/oauth-protected-resource/mcp"`.
  The MCP is an OAuth 2.0 protected resource (MCP authorization spec). opencode
  connects token-less because opencode runs the OAuth flow itself.
- **Discovery is fragile:** fetching the advertised
  `.well-known/oauth-protected-resource/mcp` returns Mobbin's SPA 404 HTML, not JSON
  metadata. This is the main integration risk (see §10).
- **Screenshots are public:** image URLs are public Supabase storage links
  (`https://…supabase.co/storage/v1/object/public/content/…`), so `--download` needs
  no auth to fetch images.

## 4. Architecture (deep modules, mirroring `gh-axi`)

| Module | Responsibility |
|---|---|
| `bin/mobbin-axi.ts` → `src/cli.ts` | Entry + command router; global flags; content-first no-args home view |
| `src/mcp/client.ts` | Only module that speaks MCP. Wraps `@modelcontextprotocol/sdk` `Client` + `StreamableHTTPClientTransport` at `https://api.mobbin.com/mcp`; exposes `callTool(name, args)`; lazy connect, session reuse |
| `src/auth/oauth-provider.ts` | Implements the SDK `OAuthClientProvider` (client metadata, redirect URL, PKCE, token hooks) |
| `src/auth/store.ts` | Persists credentials at `~/.config/mobbin-axi/credentials.json` (mode 600): access/refresh tokens, expiry, DCR client registration; refresh-on-expiry |
| `src/auth/login.ts` | `login` (localhost loopback callback + browser open + code exchange), `logout`, `auth status`; **discovery fallback** if `.well-known` 404s |
| `src/tools/*` | One mapper per Mobbin tool: CLI args → MCP args → view model |
| `src/format/toon.ts` | TOON encoding via `@toon-format/toon` |
| `src/format/truncate.ts` | Content truncation with size hints + `--full` escape hatch |
| `src/format/view.ts` | View-model assembly: minimal 3–4 field schemas, pre-computed aggregates, definitive empty states |
| `src/suggestions.ts` | Contextual next-step suggestions appended after each result |
| `src/images.ts` | Lazy `--download`: fetch public Supabase images → `~/.cache/mobbin-axi/images/<urlhash>.ext`, dedup, print local paths |
| `src/context.ts` | Home view + SessionStart ambient context |
| `src/errors.ts` | Structured errors + stable exit codes; non-interactive |
| `src/skill.ts` + `skills/mobbin-axi/SKILL.md` | Bundled Agent Skill (`user-invocable: false`) + `setup hooks` |

## 5. Command surface

- `mobbin-axi` *(no args)* → home view: auth status + a few popular apps + usage hints (live data, not help text).
- `search <query>` → `mobbin_quick_search`; `--type screens|flows|apps` narrows to the specific search tool.
- `apps <query>` → `mobbin_search_apps`; `apps --popular` → `mobbin_popular_apps`.
- `screens <query>` → `mobbin_search_screens` (by pattern/element, e.g. "Login", "Empty state").
- `flows <query>` → `mobbin_search_flows` (by flow, e.g. "Onboarding", "Checkout").
- `app <appId> screens|flows` → `mobbin_get_app_screens` / `mobbin_get_app_flows`.
- `screen <screenId>` → `mobbin_get_screen_detail`.
- `filters` → `mobbin_get_filters` (platform/category/pattern enums for filtering).
- `login` · `logout` · `auth status` · `setup hooks` · `help [command]`.

**Global flags:** `--platform ios|android|web`, `--limit N`, `--full`, `--json`, `--download`.

## 6. Data flow

`argv` → CLI router → ensure auth (load token; refresh if expiring; if none → structured
"run `mobbin-axi login`" error, non-zero exit) → tool mapper builds MCP args → MCP client
`callTool` over Streamable-HTTP with Bearer → raw JSON result → view assembler (minimal
schema + aggregates + truncation) → TOON encode → append suggestions → stdout. With
`--download`, image URLs from the result are fetched into the cache afterward and local
paths appended. `--json` bypasses TOON and emits raw structured output.

## 7. Auth design (OAuth only)

- `mobbin-axi login`: start an ephemeral localhost loopback HTTP server, build the
  authorization URL (PKCE), open the browser, receive `?code=`, exchange for tokens,
  persist to the credential store. `logout` clears; `auth status` reports state.
- Token store auto-refreshes using the refresh token when the access token is near
  expiry; all commands ensure a valid token before calling the MCP.
- **Discovery resilience:** attempt RFC 9728 protected-resource metadata → RFC 8414
  authorization-server metadata → Dynamic Client Registration. If the advertised
  `.well-known` resource metadata 404s (observed), fall back to authorization-server
  endpoints determined during the login spike (§10) so a broken discovery doc does not
  hard-block login.
- No `MOBBIN_TOKEN` paste path and no reading of opencode's token (explicitly out of
  scope per the OAuth-only decision).

## 8. Output, errors, testing

**Output (AXI principles):** TOON format; 3–4 fields per list item by default; truncation
with size hints + `--full`; pre-computed aggregates (e.g. result counts); definitive
empty states ("0 results", never blank); contextual next-step suggestions; `--json` raw
escape hatch.

**Errors:** structured errors with stable exit codes; never interactive. Examples:
not-authenticated → distinct code + "run `mobbin-axi login`"; MCP/network failure →
distinct code; bad args → usage error. All 9 tools are read-only, so no mutation
concerns.

**Testing:**
- Unit (vitest): TOON formatting, truncation, view assembly, arg parsing, suggestions —
  pure functions, table-driven.
- MCP client: tested against a mock MCP server with captured fixture tool results; no
  live Mobbin needed in CI.
- Auth: unit-test token store + refresh against a fake OAuth server; the live OAuth
  login flow is verified manually via the spike (cannot fully automate in CI).
- Fixtures: captured from real (sanitized) MCP responses, driving formatter tests.

## 9. Distribution & wiring

- npm package `mobbin-axi`; `bin` entry; TS → `dist` via `tsc`; ESM; Node ≥20.
- Deps: `@modelcontextprotocol/sdk`, `@toon-format/toon`, `axi-sdk-js`, a browser opener.
- Bundled skill installable via `npx skills add <owner>/mobbin-axi --skill mobbin-axi -g`;
  the skill teaches agents to run `npx -y mobbin-axi`.
- `mobbin-axi setup hooks` installs SessionStart ambient-context hooks for Claude Code,
  Codex, and OpenCode (mirrors `gh-axi`).
- Update opencode `~/.config/opencode/agents/frontend-designer.md` to call `mobbin-axi`
  subcommands instead of the raw `mobbin_*` MCP tools. Keep the `mobbin` MCP entry in
  `opencode.jsonc` during the transition, then remove once the AXI is verified.
- Repo lives at `Projects/mobbin-axi/` (its own git repo).

## 10. Risks & mitigations

1. **OAuth discovery brokenness** (the `.well-known` 404) — *gating risk for OAuth-only.*
   Mitigation: a login spike **first**, before building the full CLI, to map Mobbin's
   real authorization/token/registration endpoints and confirm a headless flow is
   achievable; bake in an endpoint fallback. Surface spike results before committing to
   the rest of the build. If Mobbin's flow proves undriveable headlessly, revisit the
   auth decision.
2. **Unknown exact MCP tool input/output schemas** — resolve by introspecting `tools/list`
   once authenticated (during the spike), then build mappers and fixtures from real
   responses.
3. **WSL/Windows Node duality** for any local wrapper — the `npx -y mobbin-axi` path
   avoids most of it; mirror `chrome-devtools-axi`'s wrapper approach only if needed.

## 11. Out of scope (YAGNI)

- No write/mutation commands (Mobbin is a read-only reference library).
- No result caching beyond the image cache.
- No `MOBBIN_TOKEN` paste auth or opencode-token reuse.
- No browser-automation or private-web-API backend.

## 12. Open items to confirm during implementation

- Exact OAuth authorization/token/registration endpoints (login spike).
- Exact tool argument names and result shapes (`tools/list` + sample calls).
- Confirm image URL fields present on screen/flow/app results for `--download`.
