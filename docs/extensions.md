# Extension catalog

The menu of tools/scopes we could add beyond the current 19, ordered
cheapest-first (no new OAuth scopes before new ones). This is the **what**;
[phases.md](phases.md) decides the **when** (Batch A = P3, Batch B = P4). Derived
from the scraped `scripts/slack-methods.json` (non-admin, xoxp methods only).

Inventory: of the unimplemented methods with a user scope, **24 need only scopes
we already request** (Batch A) and **~90 would add ~47 new scopes** (Batch B +
parking lot). Destructive, irreversible tools are marked **⚠**; they must respect
the [phases.md](phases.md) P2 gating decision.

## Batch A — free (zero new scopes)

Existing installs keep working with no re-consent. Ship the highest-value first.

### Priority

| Tool                    | Method                  | Note                             |
| ----------------------- | ----------------------- | -------------------------------- |
| `chat_update`           | `chat.update`           | edit a message                   |
| `chat_delete` ⚠         | `chat.delete`           | delete a message                 |
| `conversations_open`    | `conversations.open`    | start a DM / group DM            |
| `conversations_members` | `conversations.members` | who's in a channel               |
| `users_info`            | `users.info`            | direct lookup by ID              |
| `users_lookup_by_email` | `users.lookupByEmail`   | find a user by email             |
| `chat_schedule_message` | `chat.scheduleMessage`  | send later                       |
| `search_files`          | `search.files`          | search files (not just messages) |

### Remaining free candidates

- **Messaging:** `chat.postEphemeral`, `chat.meMessage`, `chat.deleteScheduledMessage`
- **Conversations:** `conversations.create`, `conversations.rename`,
  `conversations.archive` ⚠, `conversations.unarchive`, `conversations.close`,
  `conversations.kick` ⚠
- **Users / bots:** `users.getPresence`, `bots.info`
- **Search:** `search.all`
- **Usergroups:** `usergroups.disable` ⚠, `usergroups.enable`, `usergroups.users.list`

## Batch B — curated new scopes

Each row adds OAuth scope(s); users must re-install with the updated manifest.
Spend them deliberately and document the re-consent step.

| Capability               | Methods                                                                 | New scope(s)                        |
| ------------------------ | ----------------------------------------------------------------------- | ----------------------------------- |
| Read reactions           | `reactions.get` / `.list`                                               | `reactions:read`                    |
| Pins                     | `pins.list/add/remove`                                                  | `pins:read`, `pins:write`           |
| Reminders ("remind me")  | `reminders.add/list/complete/delete`                                    | `reminders:read`, `reminders:write` |
| Profile + set status     | `users.profile.get/set`                                                 | `users.profile:read`, `:write`      |
| Files: upload / delete ⚠ | `files.getUploadURLExternal` → `completeUploadExternal`, `files.delete` | `files:write`                       |

### Also available (lower priority, one scope each)

- **DnD:** `dnd.info` / `dnd.setSnooze` — `dnd:read`, `dnd:write`
- **Bookmarks:** `bookmarks.list/add/edit/remove` — `bookmarks:read`, `bookmarks:write`
- **Workspace:** `team.info` — `team:read`; `emoji.list` — `emoji:read`
- **Link unfurls:** `chat.unfurl` — `links:write`
- **Channel topic/purpose:** `conversations.setTopic`/`setPurpose` — needs the
  `*:write.topic` scope for each channel type (`channels`/`groups`/`im`/`mpim`)

## Parking lot (post-extend or explicit ask)

- **Larger Slack surfaces:** Lists (`lists:*`), Canvases (`canvases:*`), Calls
  (`calls:*`) — big, niche; only on demand.
- **Beyond xoxp:** `xoxc`/`xoxd` browser-token model, SSE/HTTP transport, `saved_*`
  — the original superset goal; revisit once the xoxp surface is best-in-class.
- **Skip:** `stars:*` (deprecated), anything `admin`/`team.billing`/`accessLogs`
  (non-admin server).
