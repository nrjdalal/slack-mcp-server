# Implementation audit & scorecard

A grounded inspection of the implementation against the [parity](parity.md) goal,
scoring every dimension. Companion to [improvements.md](improvements.md) (the
living backlog) and [ROADMAP.md](ROADMAP.md) (milestones).

This is a point-in-time snapshot — re-audit when the surface moves.

|        | reference                                                                                                                                  |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| ours   | `@nrjdalal/slack-mcp-server@0.1.4` (TypeScript, `@slack/web-api`)                                                                          |
| koro   | `korotovsky/slack-mcp-server@b88c0de3` (Go) — per [parity.md](parity.md)                                                                   |
| date   | 2026-06-15                                                                                                                                 |
| method | read all of `slack-core/src`, `slack-mcp-server/src`, `scripts`, and the test suite; verified `tiers.json` against Slack's published tiers |

## Scope

The bar is **best xoxp server at the current 19 tools** (depth before breadth).
Transport (stdio-only), token model (`xoxp`-only), and `saved_*` are deferred
"extend" items by design — they are **not** scored as parity gaps here.

## Scorecard (within the xoxp surface)

| #   | Dimension                       | Score    | vs koro         | Evidence / why                                                                                                                                                                               |
| --- | ------------------------------- | -------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Functional tool parity          | 9/10     | =               | 10 read + 9 write = 19 (`registry.ts`); matches koro's xoxp set. Names differ by convention.                                                                                                 |
| B   | Proactive rate limiting         | 9/10     | ahead           | Per-method token buckets sized by scraped tiers (`rate-limit.ts`); tiers verified (chat.postMessage=Special, files.info=Tier 4, lists=Tier 2). koro: per-invocation, few hardcoded tiers.    |
| C   | Retry / resilience              | 9/10     | ahead           | `retries:3`, randomized, 30s cap, uniform on every call incl. `history`/`replies` (`client.ts`). koro retries only wrapped sites.                                                            |
| D   | Concurrency control             | 8/10     | =               | Order-preserving `mapLimit` (`concurrency.ts`), global cap 8, unreads fan-out 4.                                                                                                             |
| E   | Caching                         | 9/10     | ahead           | Memory+disk, token-scoped hashed filename, `0600`/`0700`, lazy, inflight-dedupe, TTL, 5s miss-guard (`cache.ts`). koro: disk only.                                                           |
| F   | Name resolution                 | 9/10     | =               | ID passthrough by regex, `#`/`@` strip, string+array with dedupe (`resolve.ts` / `invoke.ts`).                                                                                               |
| G   | Pagination                      | 8/10     | = (ours opt-in) | Single page + bounded resumable `fetch_all` (`conversations.ts`). koro auto-paginates by default.                                                                                            |
| H   | **Output shaping / token cost** | **4/10** | **behind**      | history/replies/list/users_conversations/search/users_search/files return **raw** Slack objects via `JSON.stringify`. Only writes + unreads are shaped. koro trims via CSV. **Biggest gap.** |
| I   | Write gating (impl)             | 9/10     | simpler         | Single flag, fail-safe on unrecognized (`env.ts`). _Posture:_ default-on is less safe than koro's default-off — deliberate.                                                                  |
| J   | Generation / drift              | 9/10     | ahead           | scrape → json → manifests+docs+tiers, pinned by drift tests. koro hand-maintains.                                                                                                            |
| K   | Error handling                  | 7/10     | slightly behind | Tools throw → SDK wraps `isError`. koro returns errors as MCP results.                                                                                                                       |
| L   | Tests                           | 9/10     | n/a             | ~47 tests; strong edge cases (size-cap skips fetch, base64/utf8, dedupe crawl, env matrix, bucket math).                                                                                     |
| M   | DX / install                    | 9/10     | =               | npx, JSON manifests, generated README, provenance release.                                                                                                                                   |

## Findings (beyond the parity doc)

| Severity        | Finding                                                                                                                             | Location             |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| High (token)    | Raw-object output across 7 read tools — a single `conversations_history` page can be tens of KB of JSON. The #1 gap to "best xoxp". | all read tools       |
| Medium          | `files_info` returns up to 5 MB as base64 inline (~6.7 MB of text in one result); can blow an agent's context.                      | `files.ts:6,45`      |
| Medium          | `users_search` scans only the first page of `users.list` (≤1000); users beyond it are invisible (honest in the description).        | `users.ts:25`        |
| Low             | Scraper overwrites good values with `""` on a successful-but-parse-miss fetch (only `!r.ok`/throw are guarded).                     | `scrape-slack.ts:48` |
| Low             | Rate-limit interceptor derives method via `url.split("/").pop()`; a query string would corrupt the key (benign today).              | `rate-limit.ts:83`   |
| Low (by design) | Proactive wait holds a `maxRequestConcurrency` slot; a Tier-1 method could pin a slot. Acknowledged in-code; fine for single-user.  | `rate-limit.ts:89`   |

## Verdict

**Overall best-xoxp readiness: 8/10.** At functional parity and ahead of koro on
every engineering axis (rate-limit fidelity, retry coverage, caching, generation,
tests) **except output weight**, where koro's trimming beats raw JSON. That one
dimension (H), plus the `files_info` base64 and `users_search` first-page nits,
separate "very good" from "best".

## Backlog — to be best xoxp (no new tools)

1. **Response shaping** (headline) — per-tool projections of agent-useful fields
   with an opt-in `verbose` / `raw` flag. Biggest token win; keep JSON (better than
   CSV for nested data). Closes dimension H.
2. **Cap `files_info` base64** — lower the inline cap (or paginate / summarize
   large binaries) so a single file can't blow the context.
3. **Paginate `users_search`** past the first page, or raise/document the ceiling.
4. **Harden the scraper** — never overwrite a populated value with empty on a
   parse miss.
