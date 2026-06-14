# better-slack-mcp — build plan (refined to zerostarter architecture)

A user-token (`xoxp`) Slack MCP server with a **superset** of korotovsky's `slack-mcp-server` and Slack's hosted connector, built **inside the zerostarter monorepo** following its real conventions, and shipping the one publishable npm package inscope needs.

---

## 0. zerostarter architecture (the constraints we must fit)

Verified from the clone:

- **Monorepo:** Bun + Turborepo. Workspaces globs `api/*`, `packages/*`, `web/*`. Names are strictly `@<type>/<name>`: `@api/hono`, `@packages/{auth,db,env,tsconfig}`, `@web/next`.
- **Deps discipline:** external deps use `catalog:` (versions pinned in root `package.json` `catalog`); internal deps use `workspace:*`. `@modelcontextprotocol/sdk@1.29.0` and `@hono/mcp@0.3.0` are **already in the catalog but unused** (no MCP code exists anywhere yet).
- **Everything is `private: true` — nothing publishes to npm.** Release flow (`auto-release.yml`) is changelogen + version bump + GitHub release on canary→main; apps deploy to Vercel. There is **no `npm publish`**.
- **TS:** every workspace extends `@packages/tsconfig/base.json`, source in `src/`, alias `@/*` → `./src/*`.
- **Build:** tsdown, `dts: { tsgo: true }`, `entry: ["src/index.ts"]`, `minify: true`. Server apps bundle internal deps (`deps.alwaysBundle: [/^@packages\//]`) and run an env-validation hook (`getSafeEnv(env, "@api/hono")`) at `build:prepare`.
- **Env:** t3-oss/env-core, one file per workspace under `packages/env/src/*` re-exported via subpaths (`@packages/env/api-hono`, …), validated at build.
- **Auth/db (surface B material):** better-auth (GitHub + Google providers, OpenAPI + organization/teams plugins) on a Drizzle/Postgres (Bun SQL) store; `@web/next` is a fumadocs docs + marketing site.
- **Conventions (`AGENTS.md`):** `@/` imports always; **never** a `Co-authored-by` trailer; minimal comments. oxfmt (`semi:false`) + oxlint via lefthook; conventional commits (commitlint); branch flow `canary` (squash-merge PRs) → `main`.

### The reconciliation that drives everything

inscope runs its Slack server as `npx slack-mcp-server@…` — a **published, self-contained npm package**. zerostarter publishes nothing. So **exactly one workspace must break the all-private convention**: the publishable stdio server. It gets a real npm `name` (not `@packages/…`, since we don't own that scope), `private: false`, a `bin`, and a **fully bundled** `dist` (zero runtime deps, like gitpick), so a consumer with no monorepo can run it. Everything else stays private/internal.

---

## 1. Workspace plan

| New workspace | npm name | private | role |
|---|---|---|---|
| `packages/slack-core` | `@packages/slack-core` | yes | `@slack/web-api` wrapper + transport-agnostic tool registry (auth, paging, cache, tool defs/handlers) |
| `packages/slack-mcp` | **`better-slack-mcp`** (verify availability, else `@nrjdalal/better-slack-mcp`) | **no** | **stdio MCP server** + `bin`; consumes slack-core; bundles everything into `dist`; reads `SLACK_MCP_XOXP_TOKEN` at runtime. **This is what inscope `npx`-runs.** |

**Scope decision: stdio only, no frontend.** A hosted HTTP MCP endpoint, web UI, OAuth onboarding, auth, and DB are **out of scope**, so `@api/hono`, `@web/next`, `@packages/auth`, and `@packages/db` are trimmed (see §4). Two new workspaces total.

---

## 2. How each new workspace fits zero's conventions

**`@packages/slack-core`** (private lib)
- `package.json`: `@packages/slack-core`, `private:true`, `type:module`, `exports`/`types` → `dist`, dep `@slack/web-api` (add to catalog) via `catalog:`; dev `@packages/tsconfig`, `tsdown`, `typescript`, `@types/*` via `catalog:`.
- `tsconfig.json` extends `@packages/tsconfig/base.json`, `@/*`→`./src/*`.
- `tsdown.config.ts`: `dts:{tsgo:true}`, `entry:["src/index.ts"]`, `minify:true`.
- Contents: `src/client.ts` (auth + WebClient), `src/tools/*` (read/write/canvas/usergroups), `src/registry.ts` (tool list honoring read-only/allow-write).

**`better-slack-mcp`** (the published exception, folder `packages/slack-mcp`)
- `package.json`: real npm `name`, `private:false`, `bin: { "better-slack-mcp": "./dist/index.mjs" }`, `files:["dist"]`, **no `dependencies`** (all bundled).
- `tsdown.config.ts`: `deps.alwaysBundle: [/^@packages\//, "@slack/web-api", "@modelcontextprotocol/sdk"]`, `neverBundle:["bun"]`, no env hook (token is a **runtime** check, not build-time, since inscope sets it per `$PWD`).
- `src/index.ts`: `@modelcontextprotocol/sdk` `StdioServerTransport` + `McpServer`, registers slack-core tools, validates `SLACK_MCP_XOXP_TOKEN` lazily.

**Catalog edits**
- Root `catalog`: add `@slack/web-api`; keep `@modelcontextprotocol/sdk`; drop `@hono/mcp` (unused once surface B is out).
- No `packages/env` change: the stdio package reads `SLACK_MCP_XOXP_TOKEN` at **runtime** (inscope sets it per `$PWD`), so it skips zero's build-time t3-env entirely.

---

## 3. Tool catalog (broad user-token coverage)

Goal: cover the **whole useful `xoxp` Web API surface**, not a token subset. Each tool wraps a Slack method; the only limit is the OAuth scope. Tier: **R** read, **W** write (off by default behind `SLACK_MCP_ALLOW_WRITE`), **A** admin/policy-limited, **D** deprecated. Tool names below; we ship korotovsky `conversations_*` aliases for drop-in parity.

**Conversations & channels** — `list_channels` (`conversations.list`, R), `my_channels` (`users.conversations`, R), `channel_info` (`conversations.info`, R), `channel_members` (`conversations.members`, R), `channel_history` (`conversations.history`, R), `thread_replies` (`conversations.replies`, R), `unreads` (iterate, R), `open_dm` (`conversations.open`, W), `create_channel` (`conversations.create`, W), `join_channel`/`leave_channel` (W), `invite_to_channel` (`conversations.invite`, W), `remove_from_channel` (`conversations.kick`, W/A), `rename_channel` (`conversations.rename`, W), `set_topic`/`set_purpose` (W), `archive_channel`/`unarchive_channel` (W/A), `mark_read` (`conversations.mark`, W).

**Messaging** — `send_message` (`chat.postMessage`, W), `update_message` (`chat.update`, W), `delete_message` (`chat.delete`, W), `schedule_message` (`chat.scheduleMessage`, W), `list_scheduled`/`delete_scheduled` (W), `get_permalink` (`chat.getPermalink`, R). *Drafts have no public API — implement as local compose+preview, not a Slack call.*

**Search** — `search_messages` (`search.messages`, R), `search_files` (`search.files`, R), `search_all` (`search.all`, R).

**Reactions** — `add_reaction` (`reactions.add`, W), `remove_reaction` (`reactions.remove`, W), `get_reactions` (`reactions.get`, R), `my_reactions` (`reactions.list`, R).

**Files** — `list_files` (`files.list`, R), `file_info` (`files.info`, R), `download_file` (content as text/base64, ≤5MB, R), `upload_file` (upload v2: `files.getUploadURLExternal` + `files.completeUploadExternal`, W — `files.upload` is sunset), `delete_file` (`files.delete`, W), `share_public_url` (`files.sharedPublicURL`, W, **xoxp-only**).

**Users & profile** — `list_users` (`users.list`, R), `find_user_by_email` (`users.lookupByEmail`, R), `user_profile` (`users.info`/`users.profile.get`, R), `set_my_profile` (`users.profile.set`, W), `get_presence` (`users.getPresence`, R), `set_presence` (`users.setPresence`, W).

**Usergroups** — `usergroups_list` (R), `usergroups_create` (W), `usergroups_update` (W), `usergroups_enable`/`usergroups_disable` (W), `usergroups_members` (`usergroups.users.list`, R), `usergroups_set_members` (`usergroups.users.update`, W).

**Pins / Bookmarks** — pins: `pins_list`/`pin`/`unpin` (R/W/W); bookmarks: `bookmarks_list`/`add`/`edit`/`remove` (R/W). **Legacy/avoid:** `reminders.*` (degraded since 2023) and `stars.*` (sunset). Their replacement **Save-for-Later** (`saved_list`/`saved_update`/`saved_clear_completed`) lives on Slack's internal client API → **xoxc/xoxd only**, not `xoxp`.

**Canvases** — `create_canvas`/`edit_canvas`/`delete_canvas` (`canvases.*`, W), `read_canvas` (R), `set_canvas_access` (`canvases.access.set`, W).

**Workspace & status** — `team_info` (`team.info`, R), `list_emoji` (`emoji.list`, R), `dnd_info` (`dnd.info`, R), `set_snooze`/`end_snooze` (`dnd.setSnooze`/`dnd.endSnooze`, W).

Ceiling: internal-client-only endpoints (one-shot unread counts, edge search) need `xoxc`/`xoxd` (later opt-in), not `xoxp`.

> MCP-UX note: ~60 tools is a lot for one server. Default to a **curated read-first set**, expose the rest under `SLACK_MCP_ALLOW_WRITE` / an optional `SLACK_MCP_TOOLS` allowlist, so a given workspace advertises only what it needs.

## 3a. Slack app manifest (first-class onboarding artifact)

Ship a complete, paste-ready **app manifest** at the repo root (`slack-app.manifest.yaml`) so a user creates the app with all scopes in one step ("Create New App → From a manifest"), then installs and copies the `xoxp` token. This is the primary onboarding path and is what makes it enterprise-friendly.

Two variants now ship at the repo root, scope names **verified against `docs.slack.dev/reference/scopes` (Jun 2026)**:
- `manifest.readonly.yaml` — least-privilege read scopes only.
- `manifest.full.yaml` — read + write (the union below).

Also plan a Claude Desktop **DXT** manifest (`manifest-dxt.json`) like korotovsky, for one-click desktop install.

```yaml
# manifest.full.yaml  (verify exact scope names against Slack's current scope reference)
display_information:
  name: better-slack-mcp
  description: Personal, per-workspace Slack MCP server (user token)
  background_color: "#0b1221"
oauth_config:
  # redirect_urls only needed for surface B (hosted OAuth onboarding)
  scopes:
    user:
      # read
      - channels:read
      - groups:read
      - im:read
      - mpim:read
      - channels:history
      - groups:history
      - im:history
      - mpim:history
      - search:read
      - users:read
      - users:read.email
      - users.profile:read
      - usergroups:read
      - reactions:read
      - files:read
      - pins:read
      - bookmarks:read
      - reminders:read
      - emoji:read
      - team:read
      - dnd:read
      - canvases:read
      # write (drop these for the read-only variant)
      - chat:write
      - channels:write
      - groups:write
      - im:write
      - mpim:write
      - reactions:write
      - files:write
      - users.profile:write
      - usergroups:write
      - pins:write
      - bookmarks:write
      - reminders:write
      - dnd:write
      - canvases:write
settings:
  org_deploy_enabled: true
  socket_mode_enabled: false
  token_rotation_enabled: false
```

Notes: a few scopes are workspace-admin gated (kick/archive); some names differ between classic and granular apps and Slack evolves them, so the build task is to **generate** these manifests from the tool registry's declared scopes (single source of truth) and validate against Slack's scope list, rather than hand-maintaining them.

---

## 3b. Research findings & decisions (korotovsky + Slack's official plugin + Slack API docs)

Verified against source, June 2026. (Sources: korotovsky `pkg/server/server.go` + `docs/01-authentication-setup.md`; `slackapi/slack-mcp-plugin`; `docs.slack.dev/reference/{scopes,methods}`.)

**Naming & gating — adopt the best of both servers:**
- Primary tool names task-shaped like Slack's official plugin (`slack_search`, `slack_send_message`, `slack_send_message_draft`, `slack_create_canvas`), with **korotovsky `conversations_*` aliases** for drop-in parity.
- **Read-only by default.** Two-level write gating like korotovsky: registration (`SLACK_MCP_ALLOW_WRITE` / `SLACK_MCP_ENABLED_TOOLS`) + an optional runtime **channel allowlist** for posting (`SLACK_MCP_ADD_MESSAGE_TOOL=true | CID,CID | !CID`). Keep send vs draft as separate tools.

**Architecture to copy from korotovsky:**
- **Users + channels cache is essential, not optional** — without it `list_channels` and `#channel`/`@user` name-resolution break. Persist to an OS cache dir, TTL + stale-while-revalidate (`SLACK_MCP_CACHE_TTL`, default 24h).
- Expose **MCP resources** `slack://<workspace>/channels` and `slack://<workspace>/users` (CSV directories) alongside tools.
- Ship **SKILL.md** guides like the official plugin (its highest-value asset): the Slack **search DSL** (`in:`/`from:`/`has:`/`before:`/`"phrase"`/`-exclude`; Boolean AND/OR/NOT unsupported) and a **markdown→Slack formatting** table.
- Enterprise Grid: optional `SLACK_MCP_USER_AGENT` + browser-like TLS for locked-down workspaces.

**Scope facts that shaped the manifest (now verified):**
- korotovsky's **proven** xoxp set is 16 scopes; `manifest.full.yaml` extends it with reactions/files/pins/bookmarks/users.profile/canvases/dnd/team/emoji/users:read.email.
- **search = `search:read`** (classic, simplest). The hosted connector uses granular `search:read.public/.private/.im/.mpim/.files/.users` (private/im/mpim **consent-gated**) — offer as opt-in.
- Granular write apps also need `*:write.topic` (topic/purpose) and `*:write.invites` (invite) — commented in the manifest.
- `users.profile:read|write` use a **dot** (`users.profile:read`); `users:read.email` is separate and required for email.

**Differentiator — user-token-only methods** (impossible with a bot): `search.*`, `conversations.unarchive`, `files.sharedPublicURL`, `users.profile.set`, `dnd.setSnooze/endSnooze`. Lead with these.

**Operational caveats to document:**
- **History rate limit:** since 2025-05-29, **non-Marketplace** apps are throttled on `conversations.history`/`.replies` to ~1 req/min, ≤15 msgs/call. We're non-Marketplace → paginate carefully, lean on cache, surface the limit.
- **Paid-plan gates:** usergroups and canvases (`plan upgrade_required` otherwise).
- **Grid/admin gates:** `conversations.join/rename/archive` may return `enterprise_is_restricted`; `usergroups.users.update` may need an admin token.
- **Deprecations:** `files.upload` sunset (use upload v2); `stars.*` sunset; `reminders.*` degraded — treat as legacy.

**`slackapi/slack-mcp-plugin` is not a server** — it's client config (`.mcp.json` with `oauth.clientId`) for the hosted `mcp.slack.com` connector, plus slash commands + skills. No manifest, no source. We borrow its **skill files** and **task-shaped naming**, nothing else.

---

## 4. Trim plan (stdio-only ⇒ remove everything not needed)

Decision is **stdio only, no frontend**, so trim hard (clone-everything-then-trim, per the canonical convention):

- **Remove workspaces:** `web/next`, `api/hono`, `packages/auth`, `packages/db`.
- **Keep:** `packages/tsconfig`, turbo, `.github` (adapted), oxfmt/oxlint/lefthook/commitlint, `AGENTS.md`. (`packages/env` likely removable too — the stdio server uses a runtime token, not build-time env.)
- **Add:** `@packages/slack-core` + `better-slack-mcp`.
- **Root/catalog cleanup:** drop now-unused deps (next, react, drizzle, better-auth, posthog, hono, `@hono/mcp`, fumadocs, tailwind, shadcn, …); drop surface-B `globalEnv` vars in `turbo.json`; simplify root scripts (no `db:*`/`shadcn:*`). Add `@slack/web-api`.

Result: a lean Bun + turbo tools-monorepo with two workspaces.

---

## 5. CI / release (fit zero's flow, add the one exception)

- **Branching = zero's cycle; `canary` is the default branch.** PRs squash-merge into `canary`; `main` is release-only (canary→main via `auto-canary-into-main.yml`, then `auto-release.yml` runs `changelogen` + version bump + GitHub release). Reuse `auto-check-build.yml` (audit + lint + `turbo build`) and `auto-labeler.yml`; these zero workflows carry over and get adapted in M0.
- **Add** a dedicated `npm-publish.yml`: on a version tag, build `better-slack-mcp` and `npm publish --provenance` (the deliberate exception to zero's no-publish norm; only this package publishes).
- Commits: conventional, no co-author trailer (already enforced).

---

## 6. inscope integration

inscope hardcodes the slack server to `slack-mcp-server@1.3.0` (`src/generators/mcp.ts:75-85`). Add a config knob so a workspace can point at `better-slack-mcp` (custom `command`/`package`/`version`) — the same configurability extension discussed for the github server. Token plumbing (`SLACK_MCP_XOXP_TOKEN` from the chpwd hook) is unchanged, so per-`$PWD` identity works out of the box.

---

## 7. Milestones

1. **M0 Base** — `bun install`; set identity in root `package.json`; trim the surface-B workspaces + unused catalog deps; add `@slack/web-api`; `turbo run build` + lint/format green.
2. **M1 `@packages/slack-core`** — client + the read tools (history, replies, search, list/info/members, users, emoji); `bun test` with a mocked `@slack/web-api`.
3. **M2 `better-slack-mcp` (stdio)** — sdk StdioServerTransport, register slack-core tools, runtime token check, bundled `dist`, `bin` runs via `node dist/index.mjs` and `npx`.
4. **M3 Writes (gated) + canvas / files / usergroups / reminders / …** — full superset behind `SLACK_MCP_ALLOW_WRITE`.
5. **M4 Manifest + publish** — generate `manifest.{readonly,full}.yaml` from the tool registry; add `npm-publish.yml`; first `better-slack-mcp` release; README/demo.
6. **M5 inscope knob** — make inscope's slack server swappable; document.

---

## 8. Open decisions (need a call at M0)

- ~~Surface A vs A+B~~ — **decided: stdio only, no frontend.**
- **Publish exception OK?** Confirm `better-slack-mcp` goes public + gets an `npm-publish.yml`, against zero's all-private norm. (Required for inscope `npx`.)
- ~~npm name~~ — **decided: `better-slack-mcp`** (verified available on npm).
- **Tool naming:** clear verbs (`channel_history`) vs korotovsky's `conversations_*` (offer aliases for drop-in parity).
- **Whether to ship an `xoxc`/`xoxd` mode** at all.
