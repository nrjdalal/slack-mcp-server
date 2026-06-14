# better-slack-mcp

A user-token (`xoxp`) Slack MCP server: a **superset** of [korotovsky/slack-mcp-server](https://github.com/korotovsky/slack-mcp-server) and Slack's hosted connector, designed to drop into [inscope](https://github.com/nrjdalal/inscope) per workspace.

> **Status: early (M0 base).** See [`PLAN.md`](./PLAN.md) for the build plan, and `manifest.readonly.yaml` / `manifest.full.yaml` for the Slack app scopes.

## Layout

A Bun + Turborepo monorepo, built on [zerostarter](https://zerostarter.dev)'s toolchain (oxfmt, oxlint, lefthook, commitlint, tsdown).

- `packages/tsconfig` — shared TypeScript config.
- `packages/slack-core` — Slack Web API wrapper + tool registry _(M1)_.
- `packages/slack-mcp` — the published `better-slack-mcp` stdio server _(M2)_.

## Develop

```sh
bun install
bun run lint
bun run build
```

Branch flow: PRs squash-merge into `canary`; `main` is release-only.

## License

MIT
