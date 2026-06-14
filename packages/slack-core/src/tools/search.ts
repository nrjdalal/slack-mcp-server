import { z } from "zod"

import { defineTool } from "@/types"

export const searchMessages = defineTool({
  name: "search_messages",
  alias: "conversations_search_messages",
  description: 'Search messages using Slack search syntax (in:#channel from:@user "phrase").',
  tier: "read",
  scopes: ["search:read"],
  input: z.object({
    query: z.string().describe("Slack search query."),
    count: z.number().int().min(1).max(100).default(20),
    page: z.number().int().min(1).default(1),
  }),
  handler: async (client, args) => {
    const res = await client.search.messages({
      query: args.query,
      count: args.count,
      page: args.page,
    })
    return {
      matches: res.messages?.matches ?? [],
      total: res.messages?.total ?? 0,
      pagination: res.messages?.pagination,
    }
  },
})

export const searchFiles = defineTool({
  name: "search_files",
  description: "Search files across the workspace.",
  tier: "read",
  scopes: ["search:read"],
  input: z.object({
    query: z.string(),
    count: z.number().int().min(1).max(100).default(20),
    page: z.number().int().min(1).default(1),
  }),
  handler: async (client, args) => {
    const res = await client.search.files({
      query: args.query,
      count: args.count,
      page: args.page,
    })
    return {
      matches: res.files?.matches ?? [],
      total: res.files?.total ?? 0,
      pagination: res.files?.pagination,
    }
  },
})
