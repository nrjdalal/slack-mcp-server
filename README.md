# better-slack-mcp

Tool-name index, korotovsky/slack-mcp-server vs better-slack-mcp. **Bold** = shipped (M1); `-` = no counterpart.

| #   | korotovsky                                              | better-slack-mcp                                                                         |
| --- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | `channels_list`                                         | **`list_channels`**                                                                      |
| 2   | `channels_me`                                           | **`my_channels`**                                                                        |
| 3   | `conversations_history`                                 | **`channel_history`**                                                                    |
| 4   | `conversations_replies`                                 | **`thread_replies`**                                                                     |
| 5   | `conversations_search_messages`                         | **`search_messages`**                                                                    |
| 6   | `conversations_unreads`                                 | `unreads`                                                                                |
| 7   | `conversations_mark`                                    | `mark_read`                                                                              |
| 8   | `conversations_join`                                    | `join_channel`                                                                           |
| 9   | `conversations_leave`                                   | `leave_channel`                                                                          |
| 10  | `conversations_add_message`                             | `send_message`                                                                           |
| 11  | `reactions_add`                                         | `add_reaction`                                                                           |
| 12  | `reactions_remove`                                      | `remove_reaction`                                                                        |
| 13  | `attachment_get_data`                                   | `download_file`                                                                          |
| 14  | `users_search`                                          | **`list_users`** / **`find_user_by_email`**                                              |
| 15  | `usergroups_list`                                       | `usergroups_list`                                                                        |
| 16  | `usergroups_me`                                         | `usergroups_me`                                                                          |
| 17  | `usergroups_create`                                     | `usergroups_create`                                                                      |
| 18  | `usergroups_update`                                     | `usergroups_update`                                                                      |
| 19  | `usergroups_users_update`                               | `usergroups_set_members`                                                                 |
| 20  | `saved_list` / `saved_update` / `saved_clear_completed` | `-` (xoxc/xoxd only)                                                                     |
| 21  | `-`                                                     | **`channel_info`**                                                                       |
| 22  | `-`                                                     | **`channel_members`**                                                                    |
| 23  | `-`                                                     | **`search_files`**                                                                       |
| 24  | `-`                                                     | **`user_info`** / **`user_profile`**                                                     |
| 25  | `-`                                                     | **`team_info`** / **`list_emoji`**                                                       |
| 26  | `-`                                                     | `open_dm` / `create_channel` / `invite_to_channel` / `remove_from_channel`               |
| 27  | `-`                                                     | `rename_channel` / `set_topic` / `set_purpose` / `archive_channel` / `unarchive_channel` |
| 28  | `-`                                                     | `update_message` / `delete_message` / `schedule_message` / `get_permalink`               |
| 29  | `-`                                                     | `get_reactions` / `my_reactions`                                                         |
| 30  | `-`                                                     | `list_files` / `file_info` / `upload_file` / `delete_file` / `share_public_url`          |
| 31  | `-`                                                     | `set_my_profile` / `get_presence` / `set_presence`                                       |
| 32  | `-`                                                     | `pins_*` / `bookmarks_*` / `reminders_*` / `canvases_*` / `dnd_*`                        |
