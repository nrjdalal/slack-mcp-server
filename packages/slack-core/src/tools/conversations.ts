import { z } from "zod"

import { mapLimit } from "@/concurrency"
import { defineTool } from "@/types"

// conversations.info is Tier 3; a small fan-out keeps the unreads scan quick
// without bursting past the per-method rate limit.
const UNREADS_CONCURRENCY = 4

// scope sets per the Slack method reference (user-token scopes)
const readScopes = ["channels:read", "groups:read", "im:read", "mpim:read"]
const historyScopes = ["channels:history", "groups:history", "im:history", "mpim:history"]
const writeScopes = ["channels:write", "groups:write", "im:write", "mpim:write"]

const cursor = z
  .string()
  .optional()
  .describe(
    "Paginate through collections of data by setting the cursor parameter to a next_cursor attribute returned by a previous request's response_metadata.",
  )
const types = z
  .string()
  .optional()
  .describe(
    "Mix and match channel types by providing a comma-separated list of any combination of public_channel, private_channel, mpim, im.",
  )

export const conversationsHistory = defineTool({
  name: "conversations_history",
  description: "Fetches a conversation's history of messages and events.",
  tier: "read",
  scopes: historyScopes,
  input: z.object({
    channel: z.string().describe("Conversation ID to fetch history for."),
    cursor,
    include_all_metadata: z
      .boolean()
      .optional()
      .describe("Return all metadata associated with this message."),
    inclusive: z
      .boolean()
      .optional()
      .describe(
        "Include messages with oldest or latest timestamps in results. Ignored unless either timestamp is specified.",
      ),
    latest: z
      .string()
      .optional()
      .describe(
        "Only messages before this Unix timestamp will be included in results. Default is the current time.",
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(999)
      .default(100)
      .describe("The maximum number of items to return. Maximum of 999."),
    oldest: z
      .string()
      .optional()
      .describe("Only messages after this Unix timestamp will be included in results."),
  }),
  handler: async (client, args) => {
    const res = await client.conversations.history({
      channel: args.channel,
      cursor: args.cursor,
      include_all_metadata: args.include_all_metadata,
      inclusive: args.inclusive,
      latest: args.latest,
      limit: args.limit,
      oldest: args.oldest,
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
  description: "Retrieve a thread of messages posted to a conversation.",
  tier: "read",
  scopes: historyScopes,
  input: z.object({
    channel: z.string().describe("Conversation ID to fetch thread from."),
    ts: z
      .string()
      .describe(
        "Unique identifier of either a thread's parent message or a message in the thread.",
      ),
    cursor,
    include_all_metadata: z
      .boolean()
      .optional()
      .describe("Return all metadata associated with this message."),
    inclusive: z
      .boolean()
      .optional()
      .describe(
        "Include messages with oldest or latest timestamps in results. Ignored unless either timestamp is specified.",
      ),
    latest: z
      .string()
      .optional()
      .describe("Only messages before this Unix timestamp will be included in results."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(999)
      .default(100)
      .describe("The maximum number of items to return."),
    oldest: z
      .string()
      .optional()
      .describe("Only messages after this Unix timestamp will be included in results."),
  }),
  handler: async (client, args) => {
    const res = await client.conversations.replies({
      channel: args.channel,
      ts: args.ts,
      cursor: args.cursor,
      include_all_metadata: args.include_all_metadata,
      inclusive: args.inclusive,
      latest: args.latest,
      limit: args.limit,
      oldest: args.oldest,
    })
    return {
      messages: res.messages ?? [],
      has_more: res.has_more ?? false,
      next_cursor: res.response_metadata?.next_cursor || undefined,
    }
  },
})

export const conversationsList = defineTool({
  name: "conversations_list",
  description: "Lists all channels in a Slack team.",
  tier: "read",
  scopes: readScopes,
  input: z.object({
    cursor,
    exclude_archived: z
      .boolean()
      .default(true)
      .describe("Set to true to exclude archived channels from the list."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(999)
      .default(200)
      .describe("The maximum number of items to return. Must be an integer under 1000."),
    team_id: z
      .string()
      .optional()
      .describe("Encoded team id to list channels in, required if token belongs to org-wide app."),
    types,
  }),
  handler: async (client, args) => {
    const res = await client.conversations.list({
      cursor: args.cursor,
      exclude_archived: args.exclude_archived,
      limit: args.limit,
      team_id: args.team_id,
      types: args.types,
    })
    return {
      channels: res.channels ?? [],
      next_cursor: res.response_metadata?.next_cursor || undefined,
    }
  },
})

export const usersConversations = defineTool({
  name: "users_conversations",
  description: "List conversations the calling user is a member of.",
  tier: "read",
  scopes: readScopes,
  input: z.object({
    cursor,
    exclude_archived: z
      .boolean()
      .default(true)
      .describe("Set to true to exclude archived channels from the list."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(999)
      .default(200)
      .describe(
        "The maximum number of items to return. Must be an integer with a max value of 999.",
      ),
    team_id: z
      .string()
      .optional()
      .describe("Encoded team id to list conversations in, required if org token is used."),
    types,
    user: z
      .string()
      .optional()
      .describe("Browse conversations by a specific user ID's membership."),
  }),
  handler: async (client, args) => {
    const res = await client.users.conversations({
      cursor: args.cursor,
      exclude_archived: args.exclude_archived,
      limit: args.limit,
      team_id: args.team_id,
      types: args.types,
      user: args.user,
    })
    return {
      channels: res.channels ?? [],
      next_cursor: res.response_metadata?.next_cursor || undefined,
    }
  },
})

export const conversationsUnreads = defineTool({
  name: "conversations_unreads",
  description:
    "List the calling user's channels that have unread messages. Composite over users.conversations and conversations.info; partial on large workspaces.",
  tier: "read",
  scopes: [...readScopes, ...historyScopes],
  input: z.object({
    types,
    max_channels: z
      .number()
      .int()
      .min(1)
      .max(200)
      .default(50)
      .describe("Maximum number of member channels to scan for unreads."),
  }),
  handler: async (client, args) => {
    const conv = await client.users.conversations({
      types: args.types,
      limit: args.max_channels,
    })
    const scanned = await mapLimit(conv.channels ?? [], UNREADS_CONCURRENCY, async (ch) => {
      if (!ch.id) return undefined
      try {
        const info = await client.conversations.info({ channel: ch.id })
        const c = info.channel as
          | { unread_count_display?: number; unread_count?: number }
          | undefined
        const count = c?.unread_count_display ?? c?.unread_count ?? 0
        return count > 0 ? { id: ch.id, name: ch.name, unread_count: count } : undefined
      } catch {
        // best effort: a single inaccessible or throttled channel shouldn't
        // sink the whole scan, so skip it and keep the rest.
        return undefined
      }
    })
    return { unreads: scanned.filter((u) => u !== undefined) }
  },
})

export const conversationsMark = defineTool({
  name: "conversations_mark",
  description: "Sets the read cursor in a channel.",
  tier: "write",
  scopes: writeScopes,
  input: z.object({
    channel: z.string().describe("Channel or conversation to set the read cursor for."),
    ts: z
      .string()
      .describe(
        "Unique identifier of message you want marked as most recently seen in this conversation.",
      ),
  }),
  handler: async (client, args) => {
    await client.conversations.mark({ channel: args.channel, ts: args.ts })
    return { ok: true }
  },
})

export const conversationsJoin = defineTool({
  name: "conversations_join",
  description: "Joins an existing conversation.",
  tier: "write",
  scopes: ["channels:write"],
  input: z.object({
    channel: z.string().describe("ID of conversation to join."),
  }),
  handler: async (client, args) => {
    const res = await client.conversations.join({ channel: args.channel })
    return { channel: res.channel }
  },
})

export const conversationsLeave = defineTool({
  name: "conversations_leave",
  description: "Leaves a conversation.",
  tier: "write",
  scopes: writeScopes,
  input: z.object({
    channel: z.string().describe("Conversation to leave."),
  }),
  handler: async (client, args) => {
    await client.conversations.leave({ channel: args.channel })
    return { ok: true }
  },
})
