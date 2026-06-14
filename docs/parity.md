# Parity with korotovsky/slack-mcp-server

A behavior-by-behavior comparison of this server against the upstream it mirrors,
korotovsky/slack-mcp-server ("koro"). Scope is the user-token (`xoxp`) surface;
koro's browser-token (`xoxc`/`xoxd`) edge API and `saved_*` tools are out of scope
here and marked **N/A (token model)**.

This is a point-in-time snapshot — re-audit when either side moves.

|      | reference                                                         |
| ---- | ----------------------------------------------------------------- |
| koro | `korotovsky/slack-mcp-server@b88c0de3` (Go, slack-go/slack)       |
| ours | `@nrjdalal/slack-mcp-server@0.1.0` (TypeScript, `@slack/web-api`) |
| date | 2026-06-15                                                        |

## Headline: is rate limiting done the same way?

**No — same primitive, opposite philosophy.**

- **koro** is **proactive**: client-side token-bucket throttling keyed to Slack's
  published tiers (`golang.org/x/time/rate`) on its multi-call loops, search, and
  cache refresh; **selective** retry (`CallWithRetry`, max 2, honoring
  `Retry-After`) only on the calls it explicitly wraps; and a **24h on-disk
  users/channels cache** plus **internal auto-pagination** to cut request volume.
- **ours** is **reactive**: every call goes through `@slack/web-api`, which honors
  `Retry-After` and retries (3×, randomized backoff, 30s cap) uniformly, behind a
  global concurrency cap (8). No proactive throttle, no cache, single-page
  pagination; a bounded fan-out (`mapLimit` 4) only inside `conversations_unreads`.

The one shared primitive is honoring `Retry-After`. Coverage is _inverted_ on the
throttled methods: **ours retries `conversations.history`/`.replies`; koro does
not** (those handlers call through directly) — but koro tries hard never to hit
the limit via caching + pacing, while ours absorbs the limit when it happens.

## Dimension 1 — rate limiting & resilience

| Behavior                        | koro                                                                 | ours                                                | Verdict                            |
| ------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------- |
| 429 / `Retry-After`             | Honored via `CallWithRetry` on **wrapped** calls only                | Honored by `@slack/web-api` on **every** call       | SAME primitive, DIVERGENT coverage |
| Proactive tier throttle         | Token buckets: Tier2 1/3s b3, Tier2boost 1/300ms b5, Tier3 1/1.2s b4 | None (only `maxRequestConcurrency: 8`)              | OURS-LACKS                         |
| Retry count / backoff           | `maxRetries: 2`, wait = exact `Retry-After`                          | `retries: 3`, factor 2, min 1s, max 30s, randomized | DIVERGENT                          |
| Calls retried                   | search, unreads internals, cache refresh, edge                       | All calls (uniform via SDK)                         | DIVERGENT                          |
| `history`/`replies` under limit | Direct call, **no retry** → 429 surfaces                             | Retried 3× by SDK                                   | DIVERGENT (ours more resilient)    |
| Concurrency control             | Time-pacing via token buckets (intra-loop)                           | Global cap 8; `mapLimit(4)` in unreads              | DIVERGENT                          |
| Caching                         | Users + channels to disk, 24h TTL, team-scoped                       | None — every call hits Slack                        | OURS-LACKS                         |
| Pagination                      | Auto-paginates list methods internally                               | Single page; returns `next_cursor`                  | DIVERGENT                          |
| Persistent-limit behavior       | Error after ≤2 retries (or immediate, direct calls)                  | Error after 3 retries                               | DIVERGENT                          |

Refs — koro: `pkg/limiter/{limits,retry}.go`, `pkg/handler/conversations.go`
(`:550`, `:590`, `:622`, `:1027`, `:1108`), `pkg/provider/api.go`
(`:30`, `:433`, `:520`, `:728`). ours: `packages/slack-core/src/client.ts`
(`:12-19`, `:32-34`), `concurrency.ts`, `tools/conversations.ts`
(`:65`, `:122`, `:246`).

## Dimension 2 — other cross-cutting behaviors

| Behavior                          | koro                                                                        | ours                                   | Verdict                |
| --------------------------------- | --------------------------------------------------------------------------- | -------------------------------------- | ---------------------- |
| Token model                       | `xoxc`/`xoxd` (edge) **and** `xoxp`; detects bot tokens                     | `xoxp` only                            | N/A (token model)      |
| Transport                         | stdio **and** SSE/HTTP (`SLACK_MCP_HOST`/`PORT`)                            | stdio only                             | OURS-LACKS (by design) |
| Write gating                      | Per-tool env gates + `SLACK_MCP_ENABLED_TOOLS` allow-list + channel scoping | Single `SLACK_MCP_ALLOW_WRITE` boolean | DIVERGENT (deliberate) |
| `@handle` / `#channel` resolution | Yes — via the user/channel cache                                            | No — ID-based only                     | OURS-LACKS             |
| Result shape                      | Text, often CSV/markdown via `text_processor`                               | `JSON.stringify` of the mapped object  | DIVERGENT              |
| Tool errors                       | Returned as MCP results                                                     | Thrown → SDK wraps as `isError`        | DIVERGENT              |

## Dimension 3 — tool parity

| Slack capability                           | koro tool                                           | ours tool               | Verdict                   |
| ------------------------------------------ | --------------------------------------------------- | ----------------------- | ------------------------- |
| conversations.history                      | `conversations_history`                             | `conversations_history` | SAME                      |
| conversations.replies                      | `conversations_replies`                             | `conversations_replies` | SAME                      |
| conversations.list                         | `channels_list`                                     | `conversations_list`    | DIVERGENT (name)          |
| users.conversations                        | `channels_me`                                       | `users_conversations`   | DIVERGENT (name)          |
| conversations.info (unreads)               | `conversations_unreads`                             | `conversations_unreads` | SAME (diff impl)          |
| search.messages                            | `conversations_search_messages`                     | `search_messages`       | DIVERGENT (name)          |
| users lookup                               | `users_search`                                      | `users_search`          | SAME                      |
| usergroups.list/create/update/users.update | `usergroups_*` (4)                                  | `usergroups_*` (4)      | SAME                      |
| usergroups (me)                            | `usergroups_me`                                     | `usergroups_me`         | SAME                      |
| chat.postMessage                           | `conversations_add_message`                         | `chat_post_message`     | DIVERGENT (name)          |
| reactions.add/remove                       | `reactions_add`/`reactions_remove`                  | same                    | SAME                      |
| conversations.mark                         | `conversations_mark`                                | `conversations_mark`    | SAME                      |
| conversations.join/leave                   | `conversations_join`/`conversations_leave`          | same                    | SAME                      |
| files / attachment data                    | `attachment_get_data`                               | `files_info`            | DIVERGENT (name/approach) |
| stars / saved                              | `saved_list`/`saved_update`/`saved_clear_completed` | —                       | N/A (xoxc/xoxd only)      |

Functional coverage is at parity (~19 `xoxp` tools each). The difference is the
**naming convention**: koro uses entity-prefixed names (`conversations_add_message`,
`channels_list`); ours mirrors the Slack method snake-cased (`chat_post_message`,
`conversations_list`). koro additionally ships `saved_*` (browser-token only).

## Summary

- **Tools**: functionally at parity; names differ by convention.
- **Rate limiting**: genuinely different — koro proactive + cached + selective;
  ours reactive + uniform. Both honor `Retry-After`.
- **Deliberate divergences**: single write flag, stdio-only, `xoxp`-only, ID-based
  (no name resolution), no `saved_*`. See [ROADMAP](ROADMAP.md) locked decisions.
- **Real gap worth closing**: `@handle`/`#channel` resolution (a users/channels
  cache). See [improvements](improvements.md).
