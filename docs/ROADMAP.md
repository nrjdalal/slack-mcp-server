# Roadmap

`better-slack-mcp` is a user-token (xoxp) Slack MCP server that mirrors
korotovsky/slack-mcp-server's tool set, built on the zerostarter toolchain.
Work lands PR-by-PR into `canary`; `main` is release-only.

## Status

- **M0 Bootstrap**: done
- **M1 `slack-core`** (tool layer): done (PR #2, merged)
- **M2 `slack-mcp`** (stdio server): next

## What shaped the current design

- **Korotovsky parity first.** Scope is exactly the 19 user-token (xoxp) tools,
  nothing more. Superset ideas are parked until parity ships.
- **Generation is a core pillar.** Tools, manifests, and `README` / `docs/coverage.md`
  are generated from the `docs.slack.dev` reference and pinned by drift tests
  (`scripts/gen-manifests.ts`, `scripts/gen-docs.ts`, `scripts/slack-methods.json`).
- **Gating lives in the server layer.** The core only tags each tool with a
  read/write `tier`; the runtime write-gating policy follows korotovsky's
  per-tool env convention and lands in M3.
- **No frontend.**
- **Resilience and two small gaps** are tracked in issue #4.

## Milestones

### M2 - `slack-mcp` (stdio server) [next]

- New package `@packages/slack-mcp` wrapping the `slack-core` registry in
  `@modelcontextprotocol/sdk`'s `McpServer` over stdio.
- npx-able bin (`better-slack-mcp`); reads `SLACK_MCP_XOXP_TOKEN`.
- Registers tools from the registry; each call runs `invoke(tool, client, args)`.
- Read-only by default (write tools arrive gated in M3).
- Tests via the SDK in-memory transport (list tools, call roundtrip, missing-token error).
- README: `mcpServers` client config.

### M3 - write gating + safety

- Per-tool env gates: `SLACK_MCP_ADD_MESSAGE_TOOL`, `SLACK_MCP_REACTION_TOOL`,
  `SLACK_MCP_ATTACHMENT_TOOL`, `SLACK_MCP_MARK_TOOL`.
- `SLACK_MCP_ENABLED_TOOLS` allow-list; channel scoping (`true` / id-list / `!id`).
- Wire into the server's tool selection; tests.

### M4 - resilience (issue #4)

- Rate-limit handling (respect `Retry-After`) + bounded retries in the client.
- `conversations_unreads` bounded concurrency.
- Type-check `scripts/`.

### M5 - release

- Publish to npm via the `canary` -> `main` -> auto-release flow; bin, changelog,
  install docs.

## Parking lot (post-parity)

- users/channels caching for `@handle` / `#channel` resolution (koro does this;
  our tools are ID-based today).
- HTTP/SSE transport (M2 is stdio only).
- Methods beyond korotovsky's set (the original superset goal).
- `saved_*` stays out (xoxc/xoxd only; we are xoxp).

## Locked decisions

- Package/bin: `@packages/slack-mcp` internally, `better-slack-mcp` as the bin.
- M2 default exposure: read-only (writes gated in M3).
- M2 transport: stdio only.
