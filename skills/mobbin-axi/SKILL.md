---
name: mobbin-axi
description: "Research real-world UI/UX patterns from production apps via the mobbin-axi CLI — search screens, flows, and apps; inspect screen detail; download reference screenshots. Use when grounding design decisions in proven patterns."
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

## Workflow
1. `npx -y mobbin-axi` — dashboard: auth status + popular apps + next-step hints.
2. `screens "Login"`, `flows "Onboarding"`, `apps "banking"`, or `search "<query>"` to find patterns. Narrow with `--platform ios|android|web`.
3. `screen <screenId>` for full detail; `app <appId> screens|flows` for one app.
4. Add `--download` to fetch the actual screenshots as local files you can view.
5. Every response ends with `help:` next-step hints — follow them.

## Tips
- Output is TOON-encoded and token-efficient; results show ~4 fields each plus a count.
- Use `--full` for untruncated text, `--json` for raw structured output.
- `filters` lists valid platforms/categories/patterns.
