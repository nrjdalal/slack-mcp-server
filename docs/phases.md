# Phase plan (post-parity)

The forward plan for `@nrjdalal/slack-mcp-server`. Milestones M0–M5 (bootstrap →
release) are done and koro xoxp parity is reached; this doc sequences what comes
next. It is the single source for ordering — the "next" notes in
[improvements.md](improvements.md), the backlog in [audit.md](audit.md), and the
parking lot in [ROADMAP.md](ROADMAP.md) all defer here for sequence.

## North star

**Be the best xoxp Slack MCP server at the current tool count first (depth), then
extend (breadth).** Quality on what we ship beats more surface. Concretely: close
the [audit](audit.md)'s output-weight gap before adding tools, decide write-gating
before adding destructive tools, then extend cheapest-first (no new OAuth scopes
before new ones).

## Overview

| Phase | Theme                      | New tools | New scopes | Gate to start               |
| ----- | -------------------------- | --------- | ---------- | --------------------------- |
| P1    | Quality (no new tools)     | 0         | 0          | now                         |
| P2    | Write-gating decision      | 0         | 0          | before any destructive tool |
| P3    | Extend — Batch A (free)    | ~8        | 0          | after P1; P2 decided        |
| P4    | Extend — Batch B (curated) | ~10       | ~6         | after P3                    |
| —     | Parking lot                | n/a       | n/a        | post-extend / explicit ask  |

Parallel track: **M6 inscope integration** (point inscope at this package, drop
`SLACK_MCP_ADD_MESSAGE_TOOL` since writes are default-on) — orthogonal, can land
any time; not blocked by P1–P4.

---

## P1 — Quality: be the best at 19 tools

Close the [audit](audit.md) findings. No new tools, no new scopes; pure depth.

**Work items**

1. **Response shaping** (audit dimension H, the headline). Today 7 read tools
   (`conversations_history`/`replies`/`list`, `users_conversations`,
   `search_messages`, `users_search`, `files_info`) return raw Slack objects via
   `JSON.stringify` — tens of KB per page. Add per-tool projections of the
   agent-useful fields, with an opt-in `verbose` (or `raw`) flag to get the full
   object. Keep JSON (better than CSV for nested data). _Largest token win._
2. **Cap `files_info` base64** (`files.ts`). 5 MB inline → ~6.7 MB of text in one
   result; lower the inline cap and/or summarize-and-link large binaries.
3. **Paginate `users_search`** (`users.ts`) past the first `users.list` page, or
   raise + document the hard ceiling.
4. **Harden the scraper** (`scrape-slack.ts`): never overwrite a populated
   `userScopes`/`tier` with empty on a successful-but-parse-miss fetch.

**Exit:** audit dimension H ≥ 8/10; the three High/Medium findings cleared;
re-audit refreshes [audit.md](audit.md). Ships as 2–4 PRs (shaping is its own).

## P2 — Write-gating decision

`SLACK_MCP_ALLOW_WRITE` is now default-on. P3/P4 introduce **destructive,
irreversible** tools (`chat_delete`, `conversations_archive`/`kick`,
`usergroups_disable`), which the single flag would expose by default. Decide the
policy **before** building them.

**Options**

- **A — keep one flag.** Simplest; destructive ops live by default. Highest blast
  radius.
- **B — two tiers (recommended).** Writes default-on as today; destructive ops sit
  behind a second flag (e.g. `SLACK_MCP_ALLOW_DESTRUCTIVE`, default off). Preserves
  the convenient default while protecting irreversible actions. Adds a `destructive`
  marker to the tool tier in `slack-core`.
- **C — per-tool allow/deny** (`SLACK_MCP_ENABLED_TOOLS` style, koro-like). Most
  granular, most config surface.

**Exit:** a decision recorded in [ROADMAP.md](ROADMAP.md) locked decisions, and
(if B/C) the gate implemented + tested, so destructive tools land already gated.

## P3 — Extend, Batch A: free tools (zero new scopes)

24 unimplemented methods need only scopes we already request, so existing installs
keep working with no re-consent. Ship the highest-value first:

| Tool                    | Method                         | Note                           |
| ----------------------- | ------------------------------ | ------------------------------ |
| `chat_update`           | `chat.update`                  | edit a message                 |
| `chat_delete`           | `chat.delete`                  | **destructive** (needs P2)     |
| `conversations_open`    | `conversations.open`           | start a DM / group DM          |
| `conversations_members` | `conversations.members`        | who's in a channel             |
| `users_info`            | `users.info`                   | direct lookup by ID            |
| `users_lookup_by_email` | `users.lookupByEmail`          | find a user by email           |
| `chat_schedule_message` | `chat.scheduleMessage` (+ del) | send later                     |
| `search_files`          | `search.files`                 | broaden search beyond messages |

Candidates held for later within Batch A: `conversations_create`/`archive`/
`rename`/`kick` (channel lifecycle, several destructive), `files_list`,
`chat_post_ephemeral`, `users_get_presence`.

**Exit:** new tools shipped with **shaped** outputs (per P1) and respecting the P2
gate; manifests unchanged (drift confirms zero new scopes); tests + docs green.

## P4 — Extend, Batch B: curated new scopes

Each row adds OAuth scope(s), so users must re-install with the updated manifest —
spend them deliberately and document the re-consent step.

| Capability              | Methods                                                                 | New scope(s)                        |
| ----------------------- | ----------------------------------------------------------------------- | ----------------------------------- |
| Read reactions          | `reactions.get` / `.list`                                               | `reactions:read`                    |
| Pins                    | `pins.list/add/remove`                                                  | `pins:read`, `pins:write`           |
| Reminders ("remind me") | `reminders.add/list/complete`                                           | `reminders:read`, `reminders:write` |
| Profile + set status    | `users.profile.get/set`                                                 | `users.profile:read`, `:write`      |
| Files: upload / delete  | `files.getUploadURLExternal` → `completeUploadExternal`, `files.delete` | `files:write`                       |

**Exit:** manifests regenerated, README documents the re-install; tools shaped +
gated; tests + drift green.

## Parking lot (post-extend or explicit ask)

- **Larger Slack surfaces:** Lists (`lists:*`), Canvases (`canvases:*`), Calls
  (`calls:*`) — big, niche; only on demand.
- **Beyond xoxp:** `xoxc`/`xoxd` browser-token model, SSE/HTTP transport, `saved_*`
  — the original superset goal; revisit once the xoxp surface is best-in-class.
- **Skip:** `stars:*` (deprecated), anything `admin`/`team.billing`/`accessLogs`
  (non-admin server).
