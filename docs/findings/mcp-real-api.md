# Mobbin MCP — real API (captured via live spike, 2026-06-30)

The opencode config's 9 `mobbin_*` tools are STALE. The live MCP at
`https://api.mobbin.com/mcp` exposes only these 3 tools (no `mobbin_` prefix):

## search_screens
Args: `query` (required, string), `platform` (required, enum `ios`|`web`),
`mode` (`deep`|`standard`|`fast`, default `deep`), `limit` (1–30, default 20),
`exclude_screen_ids` (uuid[]), `image_format` (`webp`|`jpg`, default `webp`).
Result `structuredContent`: `{ query, screens: Screen[] }`
`Screen = { id, image_url, mobbin_url, app_name, platform }`
Content blocks: `text` + one `image` per screen (inline base64).

## search_flows
Args: `query` (required), `platform` (required `ios`|`web`), `limit` (1–10, default 5),
`page` (1–20), `image_format`.
Result: `{ query, page, has_next_page, flows: Flow[] }`
`Flow = { id, name, actions: string[], mobbin_url, app_name, platform, screen_count,
  screens: { screen_id, image_url, position }[] }`

## search_sections (website sections)
Args: `query` (required), `limit` (1–30, default 20), `page`, `image_format`.
Result: `{ query, page, has_next_page, sections: Section[] }`
`Section = { id, image_url, mobbin_url, site_name }`  (note: `site_name`, no platform)

## Notes
- `platform` is REQUIRED for screens/flows and only accepts `ios`|`web` (NO android).
- Results arrive as `structuredContent` (our `callTool` already prefers it).
- `image_url` = `https://mobbin.com/api/mcp/short/<id>` — extensionless redirect link.
- No tools exist for: apps search, app screens/flows, screen detail, filters,
  popular apps, quick search. Those commands must be dropped.
