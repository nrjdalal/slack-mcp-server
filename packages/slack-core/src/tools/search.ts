import { z } from "zod"

import { defineTool } from "@/types"

export const searchMessages = defineTool({
  name: "search_messages",
  description: "Searches for messages matching a query.",
  tier: "read",
  scopes: ["search:read"],
  input: z.object({
    query: z.string().describe("Search query."),
    count: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .describe('Number of results you want per "page". Maximum of 100.'),
    highlight: z.boolean().optional().describe("Pass true to enable query highlight markers."),
    page: z.number().int().min(1).optional().describe("Page number of results to return."),
    cursor: z
      .string()
      .optional()
      .describe(
        "Use for cursormark pagination. Send * for the first call, then the next_cursor from the previous results.",
      ),
    sort: z
      .enum(["score", "timestamp"])
      .optional()
      .describe("Return matches sorted by either score or timestamp."),
    sort_dir: z
      .enum(["asc", "desc"])
      .optional()
      .describe("Change sort direction to ascending (asc) or descending (desc)."),
    team_id: z
      .string()
      .optional()
      .describe("Encoded team id to search in, required if org token is used."),
  }),
  handler: async (client, args) => {
    const res = await client.search.messages({
      query: args.query,
      count: args.count,
      highlight: args.highlight,
      page: args.page,
      cursor: args.cursor,
      sort: args.sort,
      sort_dir: args.sort_dir,
      team_id: args.team_id,
    })
    return {
      matches: res.messages?.matches ?? [],
      total: res.messages?.total ?? 0,
      pagination: res.messages?.pagination,
      next_cursor: res.response_metadata?.next_cursor || undefined,
    }
  },
})

export const searchFiles = defineTool({
  name: "search_files",
  description: "Searches for files matching a query.",
  tier: "read",
  scopes: ["search:read"],
  input: z.object({
    query: z.string().describe("Search query."),
    count: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .describe('Number of results you want per "page". Maximum of 100.'),
    highlight: z.boolean().optional().describe("Pass true to enable query highlight markers."),
    page: z.number().int().min(1).optional().describe("Page number of results to return."),
    sort: z
      .enum(["score", "timestamp"])
      .optional()
      .describe("Return matches sorted by either score or timestamp."),
    sort_dir: z
      .enum(["asc", "desc"])
      .optional()
      .describe("Change sort direction to ascending (asc) or descending (desc)."),
    team_id: z
      .string()
      .optional()
      .describe("Encoded team id to search in, required if org token is used."),
  }),
  handler: async (client, args) => {
    const res = await client.search.files({
      query: args.query,
      count: args.count,
      highlight: args.highlight,
      page: args.page,
      sort: args.sort,
      sort_dir: args.sort_dir,
      team_id: args.team_id,
    })
    return {
      matches: res.files?.matches ?? [],
      total: res.files?.total ?? 0,
      pagination: res.files?.pagination,
      next_cursor: res.response_metadata?.next_cursor || undefined,
    }
  },
})
