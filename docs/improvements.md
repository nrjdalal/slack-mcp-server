# Improvements

A standing assessment of what's worth doing, what to leave alone, and what to
remove — distinct from the milestone plan in [ROADMAP](ROADMAP.md). Grounded in
the [parity audit](parity.md) against korotovsky/slack-mcp-server.

The codebase is healthy: lean, generated, drift-guarded, tested, published. None
of the below is urgent.

## Done

### Name resolution via a users/channels cache `[was #1, shipped]`

Tools now accept `#channel` / `@handle` (or a bare name) and resolve to IDs in
`invoke`; IDs pass through untouched. Backed by a layered cache (`cache.ts`):
in-memory per client + a token-scoped on-disk file under the OS cache dir, with a
`SLACK_MCP_CACHE_TTL` (default 24h) and a forced refresh on a miss. Populated
lazily from `conversations.list` / `users.list`, only when a name actually needs
resolving. This closes koro's last real advantage (request reduction + name UX).

## Cleanups (small, low-risk)

### 2. Fix the stray `scripts/*.d.ts` emission at the source

slack-core's dts build chases a test's `../../../scripts/gen-docs` import and
emits a declaration file outside its own package; today it's papered over with a
`.gitignore` entry. Scope the dts build to entry points (or exclude `tests/` from
declaration emit) and drop the ignore line.

### 3. Decide retry depth for the throttled methods

On a hard throttle (`Retry-After` ~60s), our `retries: 3` can block a single
interactive tool call for minutes (`Retry-After` sleep + p-retry backoff, ×3)
before surfacing. koro surfaces `conversations.history`/`.replies` 429s
immediately. For an interactive agent, failing fast (1 retry, or surface with the
`retry_after` value) is often better UX than blocking. This is a tradeoff to make
deliberately, not a bug.

## Deliberately leave alone

These are sound scope decisions; don't chase koro on them.

- **Rate limiting** — handled: reactive (`@slack/web-api` `Retry-After` + uniform
  retry) plus, since the parity audit, proactive per-method token buckets sized by
  each method's scraped Slack tier (`tiers.json`). The reactive retry still covers
  `history`/`replies` that koro leaves bare.
- **Single `SLACK_MCP_ALLOW_WRITE`** vs koro's per-tool gates — locked decision.
- **stdio-only**, **`xoxp`-only**, **no `saved_*`**, **method-snake-case tool
  names** — all deliberate (see ROADMAP locked decisions / parking lot).
- **Double validation** (SDK validates `inputSchema`, then `invoke` re-parses) —
  harmless, and `invoke` is the library entry the tests use.

## Remove

- **Code**: nothing — it's tight, no dead weight.
- **Consumer config (not this repo)**: drop a redundant upstream
  `slack-mcp-server` MCP entry once `@nrjdalal/slack-mcp-server` covers the same
  surface.

## Recommendation

Do #2 now (a few minutes), make the #3 call explicitly, and schedule #1 (name
resolution) as the headline feature after M6 — that's where the real user value is.
