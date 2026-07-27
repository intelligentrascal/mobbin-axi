---
name: mobbin-axi
description: "Research real-world UI/UX patterns from production apps and websites via the mobbin-axi CLI — search screens, user flows, and website sections by natural-language description, and download reference screenshots. Use when grounding design decisions in proven patterns."
user-invocable: false
author: Rahil
metadata:
  hermes:
    tags: [design, ui, ux, mobbin, patterns]
    category: design
---

# mobbin-axi

Agent-ergonomic Mobbin CLI for UI/UX pattern research. Prefer this over the Mobbin MCP.

Invoke with `npx -y mobbin-axi <command>`. If output shows a follow-up `mobbin-axi ...` command, run it as `npx -y mobbin-axi ...`.

Auth is one-time: if a command reports "not authenticated", run `npx -y mobbin-axi login` (opens a browser).

## Commands
- `screens "<desc>"` — search UI screens by description (defaults to `--platform ios`)
- `flows "<desc>"` — search multi-step user flows by description (defaults to `--platform ios`)
- `sections "<desc>"` — search website sections by description
- `login` — authenticate with Mobbin via browser OAuth
- `logout` — clear stored credentials
- `auth status` — report authentication state
- `setup hooks` — install SessionStart ambient-context hooks
- `help [command]` — show top-level or command-specific usage

## Flags
- `--platform ios|web` — platform (no android in the MCP; default `ios`)
- `--limit N` — cap number of results
- `--download` — fetch screenshots into `~/.cache/mobbin-axi/images/` and print local file paths

Run `<command> --help` or `help <command>` for command-specific usage. Unknown
flags and invalid command arguments return a validation error.

## Workflow
1. `npx -y mobbin-axi` — dashboard: auth status + next-step hints.
2. `screens "<desc>"`, `flows "<desc>"`, or `sections "<desc>"` to find patterns. Narrow with `--platform ios|web`.
3. Add `--download` to fetch the actual screenshots as local files you can view.
4. Every response ends with `help:` next-step hints — follow them.

## Tips
- Output is TOON-encoded and token-efficient; results show ~4 fields each plus a count.
- Describe one screen/flow/section in plain language; name an app to filter (e.g. `"Spotify now-playing screen"`).
