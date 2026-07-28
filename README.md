# mobbin-axi

Agent-ergonomic CLI for [Mobbin](https://mobbin.com) — search real-world UI/UX
patterns from production apps and websites, designed for AI agents. Built on the
[AXI](https://github.com/kunchenguid/axi) principles: token-efficient
[TOON](https://toonformat.dev) output, minimal schemas, contextual next-step
suggestions, and structured errors.

It wraps Mobbin's OAuth-gated MCP server as a scriptable, headless CLI so any
agent can research design patterns via plain shell commands — no MCP client
required.

## Install

```sh
npm install -g mobbin-axi
# or run on demand, no install:
npx -y mobbin-axi <command>
```

## Authenticate (one time)

```sh
mobbin-axi login
```

Opens your browser for Mobbin's OAuth flow (on headless/WSL it prints a URL to
paste). Tokens are stored at `~/.config/mobbin-axi/credentials.json` and
refreshed automatically. `mobbin-axi logout` clears them; `mobbin-axi auth status`
reports state.

## Commands

```
mobbin-axi                                    dashboard + next-step hints
mobbin-axi screens "<description>"            search UI screens   (defaults to --platform ios)
mobbin-axi flows "<description>"              search multi-step user flows
mobbin-axi sections "<description>"           search website sections
mobbin-axi login | logout | auth status       authentication
mobbin-axi setup hooks                         install SessionStart ambient-context hooks
mobbin-axi help [command]                      usage
```

Run `mobbin-axi <command> --help` or `mobbin-axi help <command>` for
command-specific usage. Unknown flags and invalid command arguments return a
validation error.

### Flags

- `--platform ios|web` — platform for `screens`/`flows` (default `ios`; Mobbin
  has no Android in the MCP).
- `--limit N` — cap results.
- `--download` — fetch the result screenshots into `~/.cache/mobbin-axi/images/`
  and print local file paths you can open/read.

### Examples

```sh
mobbin-axi screens "login screen with biometric authentication" --platform ios --limit 5
mobbin-axi screens "checkout with Apple Pay" --download
mobbin-axi flows "onboarding with personalization" --platform ios
mobbin-axi sections "pricing page with plan comparison"
```

Describe **one** screen/flow/section in plain language; name an app to filter
(e.g. `"Spotify now-playing screen"`). Every response ends with a `help:` block
of suggested next commands.

## License

MIT
