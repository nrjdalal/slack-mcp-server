# better-slack-mcp

Tool index: one row per Slack Web API method the package implements (14), in Slack API order. The better-slack-mcp name mirrors the method; korotovsky/slack-mcp-server's name is shown for parity (`-` = none).

| #   | slack api               | better-slack-mcp        | korotovsky                      |
| --- | ----------------------- | ----------------------- | ------------------------------- |
| 1   | `conversations.history` | `conversations_history` | `conversations_history`         |
| 2   | `conversations.info`    | `conversations_info`    | `-`                             |
| 3   | `conversations.list`    | `conversations_list`    | `channels_list`                 |
| 4   | `conversations.members` | `conversations_members` | `-`                             |
| 5   | `conversations.replies` | `conversations_replies` | `conversations_replies`         |
| 6   | `emoji.list`            | `emoji_list`            | `-`                             |
| 7   | `search.files`          | `search_files`          | `-`                             |
| 8   | `search.messages`       | `search_messages`       | `conversations_search_messages` |
| 9   | `team.info`             | `team_info`             | `-`                             |
| 10  | `users.conversations`   | `users_conversations`   | `channels_me`                   |
| 11  | `users.info`            | `users_info`            | `-`                             |
| 12  | `users.list`            | `users_list`            | `-`                             |
| 13  | `users.lookupByEmail`   | `users_lookupByEmail`   | `-`                             |
| 14  | `users.profile.get`     | `users_profile_get`     | `-`                             |
