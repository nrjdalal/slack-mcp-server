# Slack Web API coverage

All 205 non-admin methods, in [reference](https://docs.slack.dev/reference/methods/) order.

**better-slack-mcp** is our tool name (names mirror the method, snake_cased; `-` = not yet implemented). **user token scopes** are the OAuth scopes a user token (`xoxp`) needs, per the linked [method](https://docs.slack.dev/reference/methods/) and [scope](https://docs.slack.dev/reference/scopes/) pages (`-` = none listed; the method is bot/app-only or needs no scope).

| slack api | better-slack-mcp | user token scopes |
| --- | --- | --- |
| [`api.test`](https://docs.slack.dev/reference/methods/api.test) | `-` | `-` |
| [`apps.activities.list`](https://docs.slack.dev/reference/methods/apps.activities.list) | `-` | [`hosting:read`](https://docs.slack.dev/reference/scopes/hosting.read) |
| [`apps.auth.external.delete`](https://docs.slack.dev/reference/methods/apps.auth.external.delete) | `-` | `-` |
| [`apps.auth.external.get`](https://docs.slack.dev/reference/methods/apps.auth.external.get) | `-` | `-` |
| [`apps.connections.open`](https://docs.slack.dev/reference/methods/apps.connections.open) | `-` | `-` |
| [`apps.datastore.bulkDelete`](https://docs.slack.dev/reference/methods/apps.datastore.bulkDelete) | `-` | `-` |
| [`apps.datastore.bulkGet`](https://docs.slack.dev/reference/methods/apps.datastore.bulkGet) | `-` | `-` |
| [`apps.datastore.bulkPut`](https://docs.slack.dev/reference/methods/apps.datastore.bulkPut) | `-` | `-` |
| [`apps.datastore.count`](https://docs.slack.dev/reference/methods/apps.datastore.count) | `-` | `-` |
| [`apps.datastore.delete`](https://docs.slack.dev/reference/methods/apps.datastore.delete) | `-` | `-` |
| [`apps.datastore.get`](https://docs.slack.dev/reference/methods/apps.datastore.get) | `-` | `-` |
| [`apps.datastore.put`](https://docs.slack.dev/reference/methods/apps.datastore.put) | `-` | `-` |
| [`apps.datastore.query`](https://docs.slack.dev/reference/methods/apps.datastore.query) | `-` | `-` |
| [`apps.datastore.update`](https://docs.slack.dev/reference/methods/apps.datastore.update) | `-` | `-` |
| [`apps.event.authorizations.list`](https://docs.slack.dev/reference/methods/apps.event.authorizations.list) | `-` | `-` |
| [`apps.icon.set`](https://docs.slack.dev/reference/methods/apps.icon.set) | `-` | [`app_configurations:write`](https://docs.slack.dev/reference/scopes/app_configurations.write) |
| [`apps.manifest.create`](https://docs.slack.dev/reference/methods/apps.manifest.create) | `-` | `-` |
| [`apps.manifest.delete`](https://docs.slack.dev/reference/methods/apps.manifest.delete) | `-` | `-` |
| [`apps.manifest.export`](https://docs.slack.dev/reference/methods/apps.manifest.export) | `-` | `-` |
| [`apps.manifest.update`](https://docs.slack.dev/reference/methods/apps.manifest.update) | `-` | `-` |
| [`apps.manifest.validate`](https://docs.slack.dev/reference/methods/apps.manifest.validate) | `-` | `-` |
| [`apps.uninstall`](https://docs.slack.dev/reference/methods/apps.uninstall) | `-` | `-` |
| [`apps.user.connection.update`](https://docs.slack.dev/reference/methods/apps.user.connection.update) | `-` | [`users:write`](https://docs.slack.dev/reference/scopes/users.write) |
| [`assistant.search.context`](https://docs.slack.dev/reference/methods/assistant.search.context) | `-` | [`search:read.files`](https://docs.slack.dev/reference/scopes/search.read.files) · [`search:read.im`](https://docs.slack.dev/reference/scopes/search.read.im) · [`search:read.mpim`](https://docs.slack.dev/reference/scopes/search.read.mpim) · [`search:read.private`](https://docs.slack.dev/reference/scopes/search.read.private) · [`search:read.public`](https://docs.slack.dev/reference/scopes/search.read.public) · [`search:read.users`](https://docs.slack.dev/reference/scopes/search.read.users) |
| [`assistant.search.info`](https://docs.slack.dev/reference/methods/assistant.search.info) | `-` | [`search:read.public`](https://docs.slack.dev/reference/scopes/search.read.public) |
| [`assistant.threads.setStatus`](https://docs.slack.dev/reference/methods/assistant.threads.setStatus) | `-` | `-` |
| [`assistant.threads.setSuggestedPrompts`](https://docs.slack.dev/reference/methods/assistant.threads.setSuggestedPrompts) | `-` | `-` |
| [`assistant.threads.setTitle`](https://docs.slack.dev/reference/methods/assistant.threads.setTitle) | `-` | `-` |
| [`auth.revoke`](https://docs.slack.dev/reference/methods/auth.revoke) | `-` | `-` |
| [`auth.teams.list`](https://docs.slack.dev/reference/methods/auth.teams.list) | `-` | `-` |
| [`auth.test`](https://docs.slack.dev/reference/methods/auth.test) | `-` | `-` |
| [`blocks.validate`](https://docs.slack.dev/reference/methods/blocks.validate) | `-` | `-` |
| [`bookmarks.add`](https://docs.slack.dev/reference/methods/bookmarks.add) | `-` | [`bookmarks:write`](https://docs.slack.dev/reference/scopes/bookmarks.write) |
| [`bookmarks.edit`](https://docs.slack.dev/reference/methods/bookmarks.edit) | `-` | [`bookmarks:write`](https://docs.slack.dev/reference/scopes/bookmarks.write) |
| [`bookmarks.list`](https://docs.slack.dev/reference/methods/bookmarks.list) | `-` | [`bookmarks:read`](https://docs.slack.dev/reference/scopes/bookmarks.read) |
| [`bookmarks.remove`](https://docs.slack.dev/reference/methods/bookmarks.remove) | `-` | [`bookmarks:write`](https://docs.slack.dev/reference/scopes/bookmarks.write) |
| [`bots.info`](https://docs.slack.dev/reference/methods/bots.info) | `-` | [`users:read`](https://docs.slack.dev/reference/scopes/users.read) |
| [`calls.add`](https://docs.slack.dev/reference/methods/calls.add) | `-` | [`calls:write`](https://docs.slack.dev/reference/scopes/calls.write) |
| [`calls.end`](https://docs.slack.dev/reference/methods/calls.end) | `-` | [`calls:write`](https://docs.slack.dev/reference/scopes/calls.write) |
| [`calls.info`](https://docs.slack.dev/reference/methods/calls.info) | `-` | [`calls:read`](https://docs.slack.dev/reference/scopes/calls.read) |
| [`calls.participants.add`](https://docs.slack.dev/reference/methods/calls.participants.add) | `-` | [`calls:write`](https://docs.slack.dev/reference/scopes/calls.write) |
| [`calls.participants.remove`](https://docs.slack.dev/reference/methods/calls.participants.remove) | `-` | [`calls:write`](https://docs.slack.dev/reference/scopes/calls.write) |
| [`calls.update`](https://docs.slack.dev/reference/methods/calls.update) | `-` | [`calls:write`](https://docs.slack.dev/reference/scopes/calls.write) |
| [`canvases.access.delete`](https://docs.slack.dev/reference/methods/canvases.access.delete) | `-` | [`canvases:write`](https://docs.slack.dev/reference/scopes/canvases.write) |
| [`canvases.access.set`](https://docs.slack.dev/reference/methods/canvases.access.set) | `-` | [`canvases:write`](https://docs.slack.dev/reference/scopes/canvases.write) |
| [`canvases.create`](https://docs.slack.dev/reference/methods/canvases.create) | `-` | [`canvases:write`](https://docs.slack.dev/reference/scopes/canvases.write) |
| [`canvases.delete`](https://docs.slack.dev/reference/methods/canvases.delete) | `-` | [`canvases:write`](https://docs.slack.dev/reference/scopes/canvases.write) |
| [`canvases.edit`](https://docs.slack.dev/reference/methods/canvases.edit) | `-` | [`canvases:write`](https://docs.slack.dev/reference/scopes/canvases.write) |
| [`canvases.sections.lookup`](https://docs.slack.dev/reference/methods/canvases.sections.lookup) | `-` | [`canvases:read`](https://docs.slack.dev/reference/scopes/canvases.read) |
| [`chat.appendStream`](https://docs.slack.dev/reference/methods/chat.appendStream) | `-` | `-` |
| [`chat.delete`](https://docs.slack.dev/reference/methods/chat.delete) | `-` | [`chat:write`](https://docs.slack.dev/reference/scopes/chat.write) |
| [`chat.deleteScheduledMessage`](https://docs.slack.dev/reference/methods/chat.deleteScheduledMessage) | `-` | [`chat:write`](https://docs.slack.dev/reference/scopes/chat.write) |
| [`chat.getPermalink`](https://docs.slack.dev/reference/methods/chat.getPermalink) | `-` | `-` |
| [`chat.meMessage`](https://docs.slack.dev/reference/methods/chat.meMessage) | `-` | [`chat:write`](https://docs.slack.dev/reference/scopes/chat.write) |
| [`chat.postEphemeral`](https://docs.slack.dev/reference/methods/chat.postEphemeral) | `-` | [`chat:write`](https://docs.slack.dev/reference/scopes/chat.write) |
| [`chat.postMessage`](https://docs.slack.dev/reference/methods/chat.postMessage) | `chat_post_message` | [`chat:write`](https://docs.slack.dev/reference/scopes/chat.write) |
| [`chat.scheduledMessages.list`](https://docs.slack.dev/reference/methods/chat.scheduledMessages.list) | `-` | `-` |
| [`chat.scheduleMessage`](https://docs.slack.dev/reference/methods/chat.scheduleMessage) | `-` | [`chat:write`](https://docs.slack.dev/reference/scopes/chat.write) |
| [`chat.startStream`](https://docs.slack.dev/reference/methods/chat.startStream) | `-` | `-` |
| [`chat.stopStream`](https://docs.slack.dev/reference/methods/chat.stopStream) | `-` | `-` |
| [`chat.unfurl`](https://docs.slack.dev/reference/methods/chat.unfurl) | `-` | [`links:write`](https://docs.slack.dev/reference/scopes/links.write) |
| [`chat.update`](https://docs.slack.dev/reference/methods/chat.update) | `-` | [`chat:write`](https://docs.slack.dev/reference/scopes/chat.write) |
| [`conversations.acceptSharedInvite`](https://docs.slack.dev/reference/methods/conversations.acceptSharedInvite) | `-` | `-` |
| [`conversations.approveSharedInvite`](https://docs.slack.dev/reference/methods/conversations.approveSharedInvite) | `-` | `-` |
| [`conversations.archive`](https://docs.slack.dev/reference/methods/conversations.archive) | `-` | [`channels:write`](https://docs.slack.dev/reference/scopes/channels.write) · [`groups:write`](https://docs.slack.dev/reference/scopes/groups.write) · [`im:write`](https://docs.slack.dev/reference/scopes/im.write) · [`mpim:write`](https://docs.slack.dev/reference/scopes/mpim.write) |
| [`conversations.canvases.create`](https://docs.slack.dev/reference/methods/conversations.canvases.create) | `-` | [`canvases:write`](https://docs.slack.dev/reference/scopes/canvases.write) |
| [`conversations.close`](https://docs.slack.dev/reference/methods/conversations.close) | `-` | [`channels:write`](https://docs.slack.dev/reference/scopes/channels.write) · [`groups:write`](https://docs.slack.dev/reference/scopes/groups.write) · [`im:write`](https://docs.slack.dev/reference/scopes/im.write) · [`mpim:write`](https://docs.slack.dev/reference/scopes/mpim.write) |
| [`conversations.create`](https://docs.slack.dev/reference/methods/conversations.create) | `-` | [`channels:write`](https://docs.slack.dev/reference/scopes/channels.write) · [`groups:write`](https://docs.slack.dev/reference/scopes/groups.write) · [`im:write`](https://docs.slack.dev/reference/scopes/im.write) · [`mpim:write`](https://docs.slack.dev/reference/scopes/mpim.write) |
| [`conversations.declineSharedInvite`](https://docs.slack.dev/reference/methods/conversations.declineSharedInvite) | `-` | `-` |
| [`conversations.externalInvitePermissions.set`](https://docs.slack.dev/reference/methods/conversations.externalInvitePermissions.set) | `-` | `-` |
| [`conversations.history`](https://docs.slack.dev/reference/methods/conversations.history) | `conversations_history` | [`channels:history`](https://docs.slack.dev/reference/scopes/channels.history) · [`groups:history`](https://docs.slack.dev/reference/scopes/groups.history) · [`im:history`](https://docs.slack.dev/reference/scopes/im.history) · [`mpim:history`](https://docs.slack.dev/reference/scopes/mpim.history) |
| [`conversations.info`](https://docs.slack.dev/reference/methods/conversations.info) | `-` | [`channels:read`](https://docs.slack.dev/reference/scopes/channels.read) · [`groups:read`](https://docs.slack.dev/reference/scopes/groups.read) · [`im:read`](https://docs.slack.dev/reference/scopes/im.read) · [`mpim:read`](https://docs.slack.dev/reference/scopes/mpim.read) |
| [`conversations.invite`](https://docs.slack.dev/reference/methods/conversations.invite) | `-` | [`channels:write`](https://docs.slack.dev/reference/scopes/channels.write) · [`channels:write.invites`](https://docs.slack.dev/reference/scopes/channels.write.invites) · [`groups:write`](https://docs.slack.dev/reference/scopes/groups.write) · [`groups:write.invites`](https://docs.slack.dev/reference/scopes/groups.write.invites) · [`im:write`](https://docs.slack.dev/reference/scopes/im.write) · [`mpim:write`](https://docs.slack.dev/reference/scopes/mpim.write) |
| [`conversations.inviteShared`](https://docs.slack.dev/reference/methods/conversations.inviteShared) | `-` | `-` |
| [`conversations.join`](https://docs.slack.dev/reference/methods/conversations.join) | `conversations_join` | [`channels:write`](https://docs.slack.dev/reference/scopes/channels.write) |
| [`conversations.kick`](https://docs.slack.dev/reference/methods/conversations.kick) | `-` | [`channels:write`](https://docs.slack.dev/reference/scopes/channels.write) · [`groups:write`](https://docs.slack.dev/reference/scopes/groups.write) |
| [`conversations.leave`](https://docs.slack.dev/reference/methods/conversations.leave) | `conversations_leave` | [`channels:write`](https://docs.slack.dev/reference/scopes/channels.write) · [`groups:write`](https://docs.slack.dev/reference/scopes/groups.write) · [`im:write`](https://docs.slack.dev/reference/scopes/im.write) · [`mpim:write`](https://docs.slack.dev/reference/scopes/mpim.write) |
| [`conversations.list`](https://docs.slack.dev/reference/methods/conversations.list) | `conversations_list` | [`channels:read`](https://docs.slack.dev/reference/scopes/channels.read) · [`groups:read`](https://docs.slack.dev/reference/scopes/groups.read) · [`im:read`](https://docs.slack.dev/reference/scopes/im.read) · [`mpim:read`](https://docs.slack.dev/reference/scopes/mpim.read) |
| [`conversations.listConnectInvites`](https://docs.slack.dev/reference/methods/conversations.listConnectInvites) | `-` | `-` |
| [`conversations.mark`](https://docs.slack.dev/reference/methods/conversations.mark) | `conversations_mark` | [`channels:write`](https://docs.slack.dev/reference/scopes/channels.write) · [`groups:write`](https://docs.slack.dev/reference/scopes/groups.write) · [`im:write`](https://docs.slack.dev/reference/scopes/im.write) · [`mpim:write`](https://docs.slack.dev/reference/scopes/mpim.write) |
| [`conversations.members`](https://docs.slack.dev/reference/methods/conversations.members) | `-` | [`channels:read`](https://docs.slack.dev/reference/scopes/channels.read) · [`groups:read`](https://docs.slack.dev/reference/scopes/groups.read) · [`im:read`](https://docs.slack.dev/reference/scopes/im.read) · [`mpim:read`](https://docs.slack.dev/reference/scopes/mpim.read) |
| [`conversations.open`](https://docs.slack.dev/reference/methods/conversations.open) | `-` | [`channels:write`](https://docs.slack.dev/reference/scopes/channels.write) · [`groups:write`](https://docs.slack.dev/reference/scopes/groups.write) · [`im:write`](https://docs.slack.dev/reference/scopes/im.write) · [`mpim:write`](https://docs.slack.dev/reference/scopes/mpim.write) |
| [`conversations.rename`](https://docs.slack.dev/reference/methods/conversations.rename) | `-` | [`channels:write`](https://docs.slack.dev/reference/scopes/channels.write) · [`groups:write`](https://docs.slack.dev/reference/scopes/groups.write) · [`im:write`](https://docs.slack.dev/reference/scopes/im.write) · [`mpim:write`](https://docs.slack.dev/reference/scopes/mpim.write) |
| [`conversations.replies`](https://docs.slack.dev/reference/methods/conversations.replies) | `conversations_replies` | [`channels:history`](https://docs.slack.dev/reference/scopes/channels.history) · [`groups:history`](https://docs.slack.dev/reference/scopes/groups.history) · [`im:history`](https://docs.slack.dev/reference/scopes/im.history) · [`mpim:history`](https://docs.slack.dev/reference/scopes/mpim.history) |
| [`conversations.requestSharedInvite.approve`](https://docs.slack.dev/reference/methods/conversations.requestSharedInvite.approve) | `-` | `-` |
| [`conversations.requestSharedInvite.deny`](https://docs.slack.dev/reference/methods/conversations.requestSharedInvite.deny) | `-` | `-` |
| [`conversations.requestSharedInvite.list`](https://docs.slack.dev/reference/methods/conversations.requestSharedInvite.list) | `-` | `-` |
| [`conversations.setPurpose`](https://docs.slack.dev/reference/methods/conversations.setPurpose) | `-` | [`channels:write`](https://docs.slack.dev/reference/scopes/channels.write) · [`channels:write.topic`](https://docs.slack.dev/reference/scopes/channels.write.topic) · [`groups:write`](https://docs.slack.dev/reference/scopes/groups.write) · [`groups:write.topic`](https://docs.slack.dev/reference/scopes/groups.write.topic) · [`im:write`](https://docs.slack.dev/reference/scopes/im.write) · [`im:write.topic`](https://docs.slack.dev/reference/scopes/im.write.topic) · [`mpim:write`](https://docs.slack.dev/reference/scopes/mpim.write) · [`mpim:write.topic`](https://docs.slack.dev/reference/scopes/mpim.write.topic) |
| [`conversations.setTopic`](https://docs.slack.dev/reference/methods/conversations.setTopic) | `-` | [`channels:write`](https://docs.slack.dev/reference/scopes/channels.write) · [`channels:write.topic`](https://docs.slack.dev/reference/scopes/channels.write.topic) · [`groups:write`](https://docs.slack.dev/reference/scopes/groups.write) · [`groups:write.topic`](https://docs.slack.dev/reference/scopes/groups.write.topic) · [`im:write`](https://docs.slack.dev/reference/scopes/im.write) · [`im:write.topic`](https://docs.slack.dev/reference/scopes/im.write.topic) · [`mpim:write`](https://docs.slack.dev/reference/scopes/mpim.write) · [`mpim:write.topic`](https://docs.slack.dev/reference/scopes/mpim.write.topic) |
| [`conversations.unarchive`](https://docs.slack.dev/reference/methods/conversations.unarchive) | `-` | [`channels:write`](https://docs.slack.dev/reference/scopes/channels.write) · [`groups:write`](https://docs.slack.dev/reference/scopes/groups.write) · [`im:write`](https://docs.slack.dev/reference/scopes/im.write) · [`mpim:write`](https://docs.slack.dev/reference/scopes/mpim.write) |
| [`developer.apps.owners.add`](https://docs.slack.dev/reference/methods/developer.apps.owners.add) | `-` | [`apps`](https://docs.slack.dev/reference/scopes/apps) |
| [`developer.apps.owners.list`](https://docs.slack.dev/reference/methods/developer.apps.owners.list) | `-` | [`apps`](https://docs.slack.dev/reference/scopes/apps) |
| [`developer.apps.owners.remove`](https://docs.slack.dev/reference/methods/developer.apps.owners.remove) | `-` | [`apps`](https://docs.slack.dev/reference/scopes/apps) |
| [`dialog.open`](https://docs.slack.dev/reference/methods/dialog.open) | `-` | `-` |
| [`dnd.endDnd`](https://docs.slack.dev/reference/methods/dnd.endDnd) | `-` | [`dnd:write`](https://docs.slack.dev/reference/scopes/dnd.write) |
| [`dnd.endSnooze`](https://docs.slack.dev/reference/methods/dnd.endSnooze) | `-` | [`dnd:write`](https://docs.slack.dev/reference/scopes/dnd.write) |
| [`dnd.info`](https://docs.slack.dev/reference/methods/dnd.info) | `-` | [`dnd:read`](https://docs.slack.dev/reference/scopes/dnd.read) |
| [`dnd.setSnooze`](https://docs.slack.dev/reference/methods/dnd.setSnooze) | `-` | [`dnd:write`](https://docs.slack.dev/reference/scopes/dnd.write) |
| [`dnd.teamInfo`](https://docs.slack.dev/reference/methods/dnd.teamInfo) | `-` | [`dnd:read`](https://docs.slack.dev/reference/scopes/dnd.read) |
| [`emoji.list`](https://docs.slack.dev/reference/methods/emoji.list) | `-` | [`emoji:read`](https://docs.slack.dev/reference/scopes/emoji.read) |
| [`entity.presentDetails`](https://docs.slack.dev/reference/methods/entity.presentDetails) | `-` | `-` |
| [`files.comments.delete`](https://docs.slack.dev/reference/methods/files.comments.delete) | `-` | [`files:write`](https://docs.slack.dev/reference/scopes/files.write) |
| [`files.completeUploadExternal`](https://docs.slack.dev/reference/methods/files.completeUploadExternal) | `-` | [`files:write`](https://docs.slack.dev/reference/scopes/files.write) |
| [`files.delete`](https://docs.slack.dev/reference/methods/files.delete) | `-` | [`files:write`](https://docs.slack.dev/reference/scopes/files.write) |
| [`files.getUploadURLExternal`](https://docs.slack.dev/reference/methods/files.getUploadURLExternal) | `-` | [`files:write`](https://docs.slack.dev/reference/scopes/files.write) |
| [`files.info`](https://docs.slack.dev/reference/methods/files.info) | `files_info` | [`files:read`](https://docs.slack.dev/reference/scopes/files.read) |
| [`files.list`](https://docs.slack.dev/reference/methods/files.list) | `-` | [`files:read`](https://docs.slack.dev/reference/scopes/files.read) |
| [`files.remote.add`](https://docs.slack.dev/reference/methods/files.remote.add) | `-` | `-` |
| [`files.remote.info`](https://docs.slack.dev/reference/methods/files.remote.info) | `-` | [`remote_files:read`](https://docs.slack.dev/reference/scopes/remote_files.read) |
| [`files.remote.list`](https://docs.slack.dev/reference/methods/files.remote.list) | `-` | [`remote_files:read`](https://docs.slack.dev/reference/scopes/remote_files.read) |
| [`files.remote.remove`](https://docs.slack.dev/reference/methods/files.remote.remove) | `-` | `-` |
| [`files.remote.share`](https://docs.slack.dev/reference/methods/files.remote.share) | `-` | [`remote_files:share`](https://docs.slack.dev/reference/scopes/remote_files.share) |
| [`files.remote.update`](https://docs.slack.dev/reference/methods/files.remote.update) | `-` | `-` |
| [`files.revokePublicURL`](https://docs.slack.dev/reference/methods/files.revokePublicURL) | `-` | [`files:write`](https://docs.slack.dev/reference/scopes/files.write) |
| [`files.sharedPublicURL`](https://docs.slack.dev/reference/methods/files.sharedPublicURL) | `-` | [`files:write`](https://docs.slack.dev/reference/scopes/files.write) |
| [`files.upload`](https://docs.slack.dev/reference/methods/files.upload) | `-` | [`files:write`](https://docs.slack.dev/reference/scopes/files.write) |
| [`functions.completeError`](https://docs.slack.dev/reference/methods/functions.completeError) | `-` | `-` |
| [`functions.completeSuccess`](https://docs.slack.dev/reference/methods/functions.completeSuccess) | `-` | `-` |
| [`functions.distributions.permissions.add`](https://docs.slack.dev/reference/methods/functions.distributions.permissions.add) | `-` | `-` |
| [`functions.distributions.permissions.list`](https://docs.slack.dev/reference/methods/functions.distributions.permissions.list) | `-` | `-` |
| [`functions.distributions.permissions.remove`](https://docs.slack.dev/reference/methods/functions.distributions.permissions.remove) | `-` | `-` |
| [`functions.distributions.permissions.set`](https://docs.slack.dev/reference/methods/functions.distributions.permissions.set) | `-` | `-` |
| [`functions.workflows.steps.list`](https://docs.slack.dev/reference/methods/functions.workflows.steps.list) | `-` | `-` |
| [`functions.workflows.steps.responses.export`](https://docs.slack.dev/reference/methods/functions.workflows.steps.responses.export) | `-` | `-` |
| [`migration.exchange`](https://docs.slack.dev/reference/methods/migration.exchange) | `-` | [`tokens.basic`](https://docs.slack.dev/reference/scopes/tokens.basic) |
| [`oauth.access`](https://docs.slack.dev/reference/methods/oauth.access) | `-` | `-` |
| [`oauth.v2.access`](https://docs.slack.dev/reference/methods/oauth.v2.access) | `-` | `-` |
| [`oauth.v2.exchange`](https://docs.slack.dev/reference/methods/oauth.v2.exchange) | `-` | `-` |
| [`oauth.v2.user.access`](https://docs.slack.dev/reference/methods/oauth.v2.user.access) | `-` | `-` |
| [`openid.connect.token`](https://docs.slack.dev/reference/methods/openid.connect.token) | `-` | `-` |
| [`openid.connect.userInfo`](https://docs.slack.dev/reference/methods/openid.connect.userInfo) | `-` | [`openid`](https://docs.slack.dev/reference/scopes/openid) |
| [`pins.add`](https://docs.slack.dev/reference/methods/pins.add) | `-` | [`pins:write`](https://docs.slack.dev/reference/scopes/pins.write) |
| [`pins.list`](https://docs.slack.dev/reference/methods/pins.list) | `-` | [`pins:read`](https://docs.slack.dev/reference/scopes/pins.read) |
| [`pins.remove`](https://docs.slack.dev/reference/methods/pins.remove) | `-` | [`pins:write`](https://docs.slack.dev/reference/scopes/pins.write) |
| [`reactions.add`](https://docs.slack.dev/reference/methods/reactions.add) | `reactions_add` | [`reactions:write`](https://docs.slack.dev/reference/scopes/reactions.write) |
| [`reactions.get`](https://docs.slack.dev/reference/methods/reactions.get) | `-` | [`reactions:read`](https://docs.slack.dev/reference/scopes/reactions.read) |
| [`reactions.list`](https://docs.slack.dev/reference/methods/reactions.list) | `-` | [`reactions:read`](https://docs.slack.dev/reference/scopes/reactions.read) |
| [`reactions.remove`](https://docs.slack.dev/reference/methods/reactions.remove) | `reactions_remove` | [`reactions:write`](https://docs.slack.dev/reference/scopes/reactions.write) |
| [`reminders.add`](https://docs.slack.dev/reference/methods/reminders.add) | `-` | [`reminders:write`](https://docs.slack.dev/reference/scopes/reminders.write) |
| [`reminders.complete`](https://docs.slack.dev/reference/methods/reminders.complete) | `-` | [`reminders:write`](https://docs.slack.dev/reference/scopes/reminders.write) |
| [`reminders.delete`](https://docs.slack.dev/reference/methods/reminders.delete) | `-` | [`reminders:write`](https://docs.slack.dev/reference/scopes/reminders.write) |
| [`reminders.info`](https://docs.slack.dev/reference/methods/reminders.info) | `-` | [`reminders:read`](https://docs.slack.dev/reference/scopes/reminders.read) |
| [`reminders.list`](https://docs.slack.dev/reference/methods/reminders.list) | `-` | [`reminders:read`](https://docs.slack.dev/reference/scopes/reminders.read) |
| [`rtm.connect`](https://docs.slack.dev/reference/methods/rtm.connect) | `-` | `-` |
| [`rtm.start`](https://docs.slack.dev/reference/methods/rtm.start) | `-` | `-` |
| [`search.all`](https://docs.slack.dev/reference/methods/search.all) | `-` | [`search:read`](https://docs.slack.dev/reference/scopes/search.read) |
| [`search.files`](https://docs.slack.dev/reference/methods/search.files) | `-` | [`search:read`](https://docs.slack.dev/reference/scopes/search.read) |
| [`search.messages`](https://docs.slack.dev/reference/methods/search.messages) | `search_messages` | [`search:read`](https://docs.slack.dev/reference/scopes/search.read) |
| [`slackLists.access.delete`](https://docs.slack.dev/reference/methods/slackLists.access.delete) | `-` | [`lists:write`](https://docs.slack.dev/reference/scopes/lists.write) |
| [`slackLists.access.set`](https://docs.slack.dev/reference/methods/slackLists.access.set) | `-` | [`lists:write`](https://docs.slack.dev/reference/scopes/lists.write) |
| [`slackLists.create`](https://docs.slack.dev/reference/methods/slackLists.create) | `-` | [`lists:write`](https://docs.slack.dev/reference/scopes/lists.write) |
| [`slackLists.download.get`](https://docs.slack.dev/reference/methods/slackLists.download.get) | `-` | [`lists:read`](https://docs.slack.dev/reference/scopes/lists.read) |
| [`slackLists.download.start`](https://docs.slack.dev/reference/methods/slackLists.download.start) | `-` | [`lists:read`](https://docs.slack.dev/reference/scopes/lists.read) |
| [`slackLists.items.create`](https://docs.slack.dev/reference/methods/slackLists.items.create) | `-` | [`lists:write`](https://docs.slack.dev/reference/scopes/lists.write) |
| [`slackLists.items.delete`](https://docs.slack.dev/reference/methods/slackLists.items.delete) | `-` | [`lists:write`](https://docs.slack.dev/reference/scopes/lists.write) |
| [`slackLists.items.deleteMultiple`](https://docs.slack.dev/reference/methods/slackLists.items.deleteMultiple) | `-` | [`lists:write`](https://docs.slack.dev/reference/scopes/lists.write) |
| [`slackLists.items.info`](https://docs.slack.dev/reference/methods/slackLists.items.info) | `-` | [`lists:read`](https://docs.slack.dev/reference/scopes/lists.read) |
| [`slackLists.items.list`](https://docs.slack.dev/reference/methods/slackLists.items.list) | `-` | [`lists:read`](https://docs.slack.dev/reference/scopes/lists.read) |
| [`slackLists.items.update`](https://docs.slack.dev/reference/methods/slackLists.items.update) | `-` | [`lists:write`](https://docs.slack.dev/reference/scopes/lists.write) |
| [`slackLists.update`](https://docs.slack.dev/reference/methods/slackLists.update) | `-` | [`lists:write`](https://docs.slack.dev/reference/scopes/lists.write) |
| [`stars.add`](https://docs.slack.dev/reference/methods/stars.add) | `-` | [`stars:write`](https://docs.slack.dev/reference/scopes/stars.write) |
| [`stars.list`](https://docs.slack.dev/reference/methods/stars.list) | `-` | [`stars:read`](https://docs.slack.dev/reference/scopes/stars.read) |
| [`stars.remove`](https://docs.slack.dev/reference/methods/stars.remove) | `-` | [`stars:write`](https://docs.slack.dev/reference/scopes/stars.write) |
| [`team.accessLogs`](https://docs.slack.dev/reference/methods/team.accessLogs) | `-` | [`admin`](https://docs.slack.dev/reference/scopes/admin) |
| [`team.billableInfo`](https://docs.slack.dev/reference/methods/team.billableInfo) | `-` | [`admin`](https://docs.slack.dev/reference/scopes/admin) |
| [`team.billing.info`](https://docs.slack.dev/reference/methods/team.billing.info) | `-` | [`team.billing:read`](https://docs.slack.dev/reference/scopes/team.billing.read) |
| [`team.externalTeams.disconnect`](https://docs.slack.dev/reference/methods/team.externalTeams.disconnect) | `-` | `-` |
| [`team.externalTeams.list`](https://docs.slack.dev/reference/methods/team.externalTeams.list) | `-` | `-` |
| [`team.info`](https://docs.slack.dev/reference/methods/team.info) | `-` | [`team:read`](https://docs.slack.dev/reference/scopes/team.read) |
| [`team.integrationLogs`](https://docs.slack.dev/reference/methods/team.integrationLogs) | `-` | [`admin`](https://docs.slack.dev/reference/scopes/admin) |
| [`team.preferences.list`](https://docs.slack.dev/reference/methods/team.preferences.list) | `-` | [`team.preferences:read`](https://docs.slack.dev/reference/scopes/team.preferences.read) |
| [`team.profile.get`](https://docs.slack.dev/reference/methods/team.profile.get) | `-` | [`users.profile:read`](https://docs.slack.dev/reference/scopes/users.profile.read) |
| [`tooling.tokens.rotate`](https://docs.slack.dev/reference/methods/tooling.tokens.rotate) | `-` | `-` |
| [`usergroups.create`](https://docs.slack.dev/reference/methods/usergroups.create) | `usergroups_create` | [`usergroups:write`](https://docs.slack.dev/reference/scopes/usergroups.write) |
| [`usergroups.disable`](https://docs.slack.dev/reference/methods/usergroups.disable) | `-` | [`usergroups:write`](https://docs.slack.dev/reference/scopes/usergroups.write) |
| [`usergroups.enable`](https://docs.slack.dev/reference/methods/usergroups.enable) | `-` | [`usergroups:write`](https://docs.slack.dev/reference/scopes/usergroups.write) |
| [`usergroups.list`](https://docs.slack.dev/reference/methods/usergroups.list) | `usergroups_list` | [`usergroups:read`](https://docs.slack.dev/reference/scopes/usergroups.read) |
| [`usergroups.update`](https://docs.slack.dev/reference/methods/usergroups.update) | `usergroups_update` | [`usergroups:write`](https://docs.slack.dev/reference/scopes/usergroups.write) |
| [`usergroups.users.list`](https://docs.slack.dev/reference/methods/usergroups.users.list) | `-` | [`usergroups:read`](https://docs.slack.dev/reference/scopes/usergroups.read) |
| [`usergroups.users.update`](https://docs.slack.dev/reference/methods/usergroups.users.update) | `usergroups_users_update` | [`usergroups:write`](https://docs.slack.dev/reference/scopes/usergroups.write) |
| [`users.conversations`](https://docs.slack.dev/reference/methods/users.conversations) | `users_conversations` | [`channels:read`](https://docs.slack.dev/reference/scopes/channels.read) · [`groups:read`](https://docs.slack.dev/reference/scopes/groups.read) · [`im:read`](https://docs.slack.dev/reference/scopes/im.read) · [`mpim:read`](https://docs.slack.dev/reference/scopes/mpim.read) |
| [`users.deletePhoto`](https://docs.slack.dev/reference/methods/users.deletePhoto) | `-` | [`users.profile:write`](https://docs.slack.dev/reference/scopes/users.profile.write) |
| [`users.discoverableContacts.lookup`](https://docs.slack.dev/reference/methods/users.discoverableContacts.lookup) | `-` | `-` |
| [`users.getPresence`](https://docs.slack.dev/reference/methods/users.getPresence) | `-` | [`users:read`](https://docs.slack.dev/reference/scopes/users.read) |
| [`users.identity`](https://docs.slack.dev/reference/methods/users.identity) | `-` | [`identity:read`](https://docs.slack.dev/reference/scopes/identity.read) |
| [`users.info`](https://docs.slack.dev/reference/methods/users.info) | `-` | [`users:read`](https://docs.slack.dev/reference/scopes/users.read) |
| [`users.list`](https://docs.slack.dev/reference/methods/users.list) | `-` | [`users:read`](https://docs.slack.dev/reference/scopes/users.read) |
| [`users.lookupByEmail`](https://docs.slack.dev/reference/methods/users.lookupByEmail) | `-` | [`users:read.email`](https://docs.slack.dev/reference/scopes/users.read.email) |
| [`users.profile.get`](https://docs.slack.dev/reference/methods/users.profile.get) | `-` | [`users.profile:read`](https://docs.slack.dev/reference/scopes/users.profile.read) |
| [`users.profile.set`](https://docs.slack.dev/reference/methods/users.profile.set) | `-` | [`users.profile:write`](https://docs.slack.dev/reference/scopes/users.profile.write) |
| [`users.setActive`](https://docs.slack.dev/reference/methods/users.setActive) | `-` | [`users:write`](https://docs.slack.dev/reference/scopes/users.write) |
| [`users.setPhoto`](https://docs.slack.dev/reference/methods/users.setPhoto) | `-` | [`users.profile:write`](https://docs.slack.dev/reference/scopes/users.profile.write) |
| [`users.setPresence`](https://docs.slack.dev/reference/methods/users.setPresence) | `-` | [`users:write`](https://docs.slack.dev/reference/scopes/users.write) |
| [`views.open`](https://docs.slack.dev/reference/methods/views.open) | `-` | `-` |
| [`views.publish`](https://docs.slack.dev/reference/methods/views.publish) | `-` | `-` |
| [`views.push`](https://docs.slack.dev/reference/methods/views.push) | `-` | `-` |
| [`views.update`](https://docs.slack.dev/reference/methods/views.update) | `-` | `-` |
| [`workflows.featured.add`](https://docs.slack.dev/reference/methods/workflows.featured.add) | `-` | [`bookmarks:write`](https://docs.slack.dev/reference/scopes/bookmarks.write) |
| [`workflows.featured.list`](https://docs.slack.dev/reference/methods/workflows.featured.list) | `-` | [`bookmarks:read`](https://docs.slack.dev/reference/scopes/bookmarks.read) |
| [`workflows.featured.remove`](https://docs.slack.dev/reference/methods/workflows.featured.remove) | `-` | [`bookmarks:write`](https://docs.slack.dev/reference/scopes/bookmarks.write) |
| [`workflows.featured.set`](https://docs.slack.dev/reference/methods/workflows.featured.set) | `-` | [`bookmarks:write`](https://docs.slack.dev/reference/scopes/bookmarks.write) |
| [`workflows.triggers.permissions.add`](https://docs.slack.dev/reference/methods/workflows.triggers.permissions.add) | `-` | `-` |
| [`workflows.triggers.permissions.list`](https://docs.slack.dev/reference/methods/workflows.triggers.permissions.list) | `-` | `-` |
| [`workflows.triggers.permissions.remove`](https://docs.slack.dev/reference/methods/workflows.triggers.permissions.remove) | `-` | `-` |
| [`workflows.triggers.permissions.set`](https://docs.slack.dev/reference/methods/workflows.triggers.permissions.set) | `-` | `-` |
