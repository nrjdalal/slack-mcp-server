import { z } from "zod"

import { defineTool } from "@/types"

const cursor = z.string().optional().describe("Pagination cursor from a previous call.")
const channelTypes = z
  .string()
  .optional()
  .describe("Comma-separated: public_channel,private_channel,mpim,im.")
const readScopes = ["channels:read", "groups:read", "im:read", "mpim:read"]
const historyScopes = ["channels:history", "groups:history", "im:history", "mpim:history"]

export const listChannels = defineTool({
  name: "list_channels",
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

export const myChannels = defineTool({
  name: "my_channels",
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

export const channelInfo = defineTool({
  name: "channel_info",
  alias: "conversations_info",
  description: "Get metadata about a channel or conversation.",
  tier: "read",
  scopes: readScopes,
  input: z.object({ channel: z.string().describe("Channel ID (Cxxxx).") }),
  handler: async (client, args) => {
    const res = await client.conversations.info({ channel: args.channel })
    return { channel: res.channel }
  },
})

export const channelMembers = defineTool({
  name: "channel_members",
  alias: "conversations_members",
  description: "List the member user IDs of a channel.",
  tier: "read",
  scopes: readScopes,
  input: z.object({
    channel: z.string(),
    limit: z.number().int().min(1).max(1000).default(200),
    cursor,
  }),
  handler: async (client, args) => {
    const res = await client.conversations.members({
      channel: args.channel,
      limit: args.limit,
      cursor: args.cursor,
    })
    return {
      members: res.members ?? [],
      next_cursor: res.response_metadata?.next_cursor || undefined,
    }
  },
})

export const channelHistory = defineTool({
  name: "channel_history",
  alias: "conversations_history",
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

export const threadReplies = defineTool({
  name: "thread_replies",
  alias: "conversations_replies",
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
