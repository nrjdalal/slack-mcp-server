# better-slack-mcp

A user-token (xoxp) Slack MCP server. Tools mirror the Slack Web API.

## Implemented

**better-slack-mcp** is our tool name (names mirror the method, snake_cased; `-` = not yet implemented); **korotovsky** is korotovsky/slack-mcp-server's name where it maps 1:1 (`-` = none).

16 methods covered 1:1, plus 3 composite tools that wrap no single method: `conversations_unreads`, `users_search`, `usergroups_me` (19 tools total). korotovsky additionally ships `saved_*`, which are browser-token only.

| slack api                 | better-slack-mcp          | korotovsky                      |
| ------------------------- | ------------------------- | ------------------------------- |
| `chat.postMessage`        | `chat_post_message`       | `conversations_add_message`     |
| `conversations.history`   | `conversations_history`   | `conversations_history`         |
| `conversations.join`      | `conversations_join`      | `conversations_join`            |
| `conversations.leave`     | `conversations_leave`     | `conversations_leave`           |
| `conversations.list`      | `conversations_list`      | `channels_list`                 |
| `conversations.mark`      | `conversations_mark`      | `conversations_mark`            |
| `conversations.replies`   | `conversations_replies`   | `conversations_replies`         |
| `files.info`              | `files_info`              | `attachment_get_data`           |
| `reactions.add`           | `reactions_add`           | `reactions_add`                 |
| `reactions.remove`        | `reactions_remove`        | `reactions_remove`              |
| `search.messages`         | `search_messages`         | `conversations_search_messages` |
| `usergroups.create`       | `usergroups_create`       | `usergroups_create`             |
| `usergroups.list`         | `usergroups_list`         | `usergroups_list`               |
| `usergroups.update`       | `usergroups_update`       | `usergroups_update`             |
| `usergroups.users.update` | `usergroups_users_update` | `usergroups_users_update`       |
| `users.conversations`     | `users_conversations`     | `channels_me`                   |

See [docs/coverage.md](docs/coverage.md) for the full non-admin Slack Web API surface (205 methods).
