# Roadmap

`slack-mcp-server` (npm `@nrjdalal/slack-mcp-server`) is a user-token (xoxp) Slack
MCP server that mirrors korotovsky/slack-mcp-server's tool set, built on the
zerostarter toolchain.
Work lands PR-by-PR into `canary`; `main` is release-only.

Related: [phases.md](phases.md) (forward plan / sequence) ·
[extensions.md](extensions.md) (extend catalog: tools + scopes) ·
[parity.md](parity.md) (behavior comparison vs korotovsky) ·
[improvements.md](improvements.md) (standing do/leave/remove assessment) ·
[audit.md](audit.md) (scored implementation snapshot).

## Status

- **M0 Bootstrap**: done
- **M1 `slack-core`** (tool layer): done (PR #2, merged)
- **M2 `slack-mcp`** (stdio server): done
- **M3 write gating**: done
- **M4 resilience**: done
- **M5 release**: done
- **M6 inscope integration**: next

## What shaped the current design

- **Korotovsky parity first.** Scope is exactly the 19 user-token (xoxp) tools,
  nothing more. Superset ideas are parked until parity ships.
- **Generation is a core pillar.** Tools, manifests, and `README` / `docs/coverage.md`
  are generated from the `docs.slack.dev` reference and pinned by drift tests
  (`scripts/gen-manifests.ts`, `scripts/gen-docs.ts`, `scripts/slack-methods.json`).
- **Gating lives in the server layer.** The core only tags each tool with a
  read/write `tier`; the server reads a single `SLACK_MCP_ALLOW_WRITE` flag and
  selects `enabledTools(allowWrite)`. We deliberately diverged from korotovsky's
  per-tool env gates (`SLACK_MCP_ADD_MESSAGE_TOOL`, ...) in favour of one switch.
- **No frontend.**
- **Resilience and two small gaps** are tracked in issue #4.

## Milestones

### M2 - `slack-mcp` (stdio server) [done]

- New package `@nrjdalal/slack-mcp-server` (`packages/slack-mcp-server`) wrapping
  the `slack-core` registry in `@modelcontextprotocol/sdk`'s `McpServer` over stdio.
- npx-able bin (`slack-mcp-server`); reads `SLACK_MCP_XOXP_TOKEN`.
- Registers tools from the registry; each call runs `invoke(tool, client, args)`.
- Read-only by default (write tools arrive gated in M3).
- Tests via the SDK in-memory transport (list tools, call roundtrip, missing-token error).
- README: `mcpServers` client config.
- `slack-core` is bundled into the published artifact (it stays private/unpublished),
  so the only runtime deps are `@modelcontextprotocol/sdk`, `@slack/web-api`, `zod`.

### M3 - write gating [done]

- Single `SLACK_MCP_ALLOW_WRITE` flag, **writes on by default**; set a falsy
  value (`false` / `0`, case-insensitive) to run read-only. A set-but-unrecognized
  value (e.g. `off`, `no`) **fails safe to read-only** so a fumbled disable can't
  silently leave writes on; only unset/empty keeps the default. The server reads it
  (`packages/slack-mcp-server/src/env.ts`) and passes `allowWrite` to
  `createServer`, which selects `enabledTools(allowWrite)`: all 19 tools on,
  10 read-only when disabled.
- Deliberately simpler than korotovsky: no per-tool gates, no
  `SLACK_MCP_ENABLED_TOOLS` allow-list, no channel scoping. Trade-off: a config
  switching from `slack-mcp-server` must rename its write env to
  `SLACK_MCP_ALLOW_WRITE` (relevant to the M6 inscope swap).
- Tests: env helper truthiness + env-driven tool exposure end to end.

### M4 - resilience (issue #4) [done]

- Rate-limit handling: `@slack/web-api` already honours 429 `Retry-After` and
  retries, so `createClient` sets the policy _explicitly_ and tunes it for
  interactive use - `retries: 3` (vs the SDK's ~30-min default) so a throttled
  call surfaces an error in minutes, plus an explicit `maxRequestConcurrency`.
  Overridable via a `WebClientOptions` arg.
- `conversations_unreads` bounded concurrency via `mapLimit` (`@/concurrency`),
  replacing the serial scan; fan-out capped so it doesn't burst the Tier-3 limit.
- Type-check `scripts/` (`scripts/tsconfig.json`), wired into `check-types`;
  `check-types` now also runs in CI.
- Bonus: `SLACK_MCP_ALLOW_WRITE` warns on a set-but-unrecognized value.
- Context: since 2025-05-29, non-Marketplace apps are throttled on
  `conversations.history` / `.replies` (~1 req/min), which is why retries are
  capped low rather than left at the SDK default.

### M5 - release [done]

- Publishes `@nrjdalal/slack-mcp-server` to npm from the existing `auto-release`
  job (no separate workflow): the publish runs after changelogen computes the
  version and _before_ the atomic tag/branch push, so a failed publish never
  leaves a tag or GitHub release for a version that isn't on npm.
- `npm publish --provenance --access public` (OIDC `id-token: write`). Monorepo
  fixes: the bumped version is mirrored into the workspace manifest, the
  `catalog:` protocol is resolved to concrete versions npm can read, and
  `scripts`/`devDependencies` are stripped before publishing.
- Auto-derived versioning (changelogen) is kept; `NPM_TOKEN` gates the run.

### M6 - inscope integration

- Make inscope's Slack MCP server swappable (it currently pins korotovsky's
  `slack-mcp-server`) so a workspace can point at `@nrjdalal/slack-mcp-server`.
  Token plumbing (`SLACK_MCP_XOXP_TOKEN`) is unchanged, so per-directory identity
  keeps working. Writes move from korotovsky's per-tool gates to our single
  `SLACK_MCP_ALLOW_WRITE`.

## Parking lot (post-parity)

- ~~users/channels caching for `@handle` / `#channel` resolution~~ — done
  (in-memory + on-disk cache, resolved in `invoke`; see
  [improvements](improvements.md)).
- HTTP/SSE transport (M2 is stdio only).
- Methods beyond korotovsky's set (the original superset goal).
- `saved_*` stays out (xoxc/xoxd only; we are xoxp).

## Locked decisions

- **Published package**: `@nrjdalal/slack-mcp-server` (npm `name`, `private: false`,
  bin `slack-mcp-server`), built from the `packages/slack-mcp-server` workspace. It is
  the one public package (the deliberate exception to zerostarter's all-private norm,
  required for `npx @nrjdalal/slack-mcp-server`). `@packages/slack-core` stays private
  and is consumed as a `workspace:*` dependency. The GitHub repo and project are
  `slack-mcp-server` (renamed from `better-slack-mcp` during M5).
- **M2 default exposure**: read-only (write tools gated in M3). _Superseded:_ the
  default flipped to writes-on (see M3 below).
- **M2 transport**: stdio only.
- **M3 write gating**: one `SLACK_MCP_ALLOW_WRITE` boolean, not korotovsky's
  per-tool env gates. Simpler over parity, knowingly. Default flipped to
  **writes-on** so the npx/inscope swap needs no write env at all (set
  `SLACK_MCP_ALLOW_WRITE=false` for read-only).
