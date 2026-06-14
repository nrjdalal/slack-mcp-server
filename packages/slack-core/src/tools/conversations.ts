import { z } from "zod"

import { defineTool } from "@/types"

const cursor = z.string().optional().describe("Pagination cursor from a previous call.")
const channelTypes = z
  .string()
  .optional()
  .describe("Comma-separated: public_channel,private_channel,mpim,im.")
const readScopes = ["channels:read", "groups:read", "im:read", "mpim:read"]
const historyScopes = ["channels:history", "groups:history", "im:history", "mpim:history"]
const writeScopes = ["channels:write", "groups:write", "im:write", "mpim:write"]

export const conversationsList = defineTool({
  name: "conversations_list",
  alias: "channels_list",
  description: "List channels in the workspace, optionally filtered by type.",
  tier: "read",
  scopes: readScopes,
  input: z.object({
    types: channelTypes,
    exclude_archived: z.boolean().default(true),
    limit: z.number().int().min(1).max(1000).default(200),
    cursor,
  }),
  handler: async (client, args) => {
    const res = await client.conversations.list({
      types: args.types,
      exclude_archived: args.exclude_archived,
      limit: args.limit,
      cursor: args.cursor,
    })
    return {
      channels: res.channels ?? [],
      next_cursor: res.response_metadata?.next_cursor || undefined,
    }
  },
})

export const usersConversations = defineTool({
  name: "users_conversations",
  alias: "channels_me",
  description: "List channels the authenticated user is a member of.",
  tier: "read",
  scopes: readScopes,
  input: z.object({
    types: channelTypes,
    limit: z.number().int().min(1).max(1000).default(200),
    cursor,
  }),
  handler: async (client, args) => {
    const res = await client.users.conversations({
      types: args.types,
      limit: args.limit,
      cursor: args.cursor,
    })
    return {
      channels: res.channels ?? [],
      next_cursor: res.response_metadata?.next_cursor || undefined,
    }
  },
})

export const conversationsHistory = defineTool({
  name: "conversations_history",
  description: "Get recent messages from a channel or DM.",
  tier: "read",
  scopes: historyScopes,
  input: z.object({
    channel: z.string(),
    limit: z.number().int().min(1).max(1000).default(50),
    oldest: z.string().optional(),
    latest: z.string().optional(),
    cursor,
  }),
  handler: async (client, args) => {
    const res = await client.conversations.history({
      channel: args.channel,
      limit: args.limit,
      oldest: args.oldest,
      latest: args.latest,
      cursor: args.cursor,
    })
    return {
      messages: res.messages ?? [],
      has_more: res.has_more ?? false,
      next_cursor: res.response_metadata?.next_cursor || undefined,
    }
  },
})

export const conversationsReplies = defineTool({
  name: "conversations_replies",
  description: "Get the replies in a message thread.",
  tier: "read",
  scopes: historyScopes,
  input: z.object({
    channel: z.string(),
    ts: z.string().describe("Parent message timestamp."),
    limit: z.number().int().min(1).max(1000).default(50),
    cursor,
  }),
  handler: async (client, args) => {
    const res = await client.conversations.replies({
      channel: args.channel,
      ts: args.ts,
      limit: args.limit,
      cursor: args.cursor,
    })
    return {
      messages: res.messages ?? [],
      has_more: res.has_more ?? false,
      next_cursor: res.response_metadata?.next_cursor || undefined,
    }
  },
})

export const conversationsUnreads = defineTool({
  name: "conversations_unreads",
  description:
    "List channels with unread messages for the authenticated user (scans member channels; partial on large workspaces).",
  tier: "read",
  scopes: [...readScopes, ...historyScopes],
  input: z.object({
    types: channelTypes,
    max_channels: z.number().int().min(1).max(200).default(50),
  }),
  handler: async (client, args) => {
    const conv = await client.users.conversations({
      types: args.types,
      limit: args.max_channels,
    })
    const unreads: Array<{ id: string; name?: string; unread_count: number }> = []
    for (const ch of conv.channels ?? []) {
      if (!ch.id) continue
      const info = await client.conversations.info({ channel: ch.id })
      const c = info.channel as { unread_count_display?: number; unread_count?: number } | undefined
      const count = c?.unread_count_display ?? c?.unread_count ?? 0
      if (count > 0) unreads.push({ id: ch.id, name: ch.name, unread_count: count })
    }
    return { unreads }
  },
})

export const conversationsMark = defineTool({
  name: "conversations_mark",
  description: "Mark a channel or DM as read up to a message timestamp.",
  tier: "write",
  scopes: writeScopes,
  input: z.object({
    channel: z.string(),
    ts: z.string().describe("Timestamp of the most recently seen message."),
  }),
  handler: async (client, args) => {
    await client.conversations.mark({ channel: args.channel, ts: args.ts })
    return { ok: true }
  },
})

export const conversationsJoin = defineTool({
  name: "conversations_join",
  description: "Join a public channel.",
  tier: "write",
  scopes: ["channels:write"],
  input: z.object({ channel: z.string() }),
  handler: async (client, args) => {
    const res = await client.conversations.join({ channel: args.channel })
    return { channel: res.channel }
  },
})

export const conversationsLeave = defineTool({
  name: "conversations_leave",
  description: "Leave a channel (cannot leave #general).",
  tier: "write",
  scopes: writeScopes,
  input: z.object({ channel: z.string() }),
  handler: async (client, args) => {
    await client.conversations.leave({ channel: args.channel })
    return { ok: true }
  },
})
