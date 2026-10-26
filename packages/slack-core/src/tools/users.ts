import { z } from "zod"

import { rawInput, shapeAll, shapeUser } from "@/shape"
import { defineTool, NO_CONTEXT } from "@/types"

// Slack recommends no more than 200 users per users.list page.
const PAGE_SIZE = 200

export const usersSearch = defineTool({
  name: "users_search",
  title: "Search users",
  description:
    "Find users by matching a query against id, name, real name, display name, or email (case-insensitive). Composite over users.list.",
  // users.list needs users:read; users:read.email is required for the email field this tool matches on.
  tier: "read",
  scopes: ["users:read", "users:read.email"],
  input: z.object({
    query: z
      .string()
      .describe("Substring to match against id, name, real name, display name, or email."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(10000)
      .default(1000)
      .describe(
        "The maximum number of users to scan. Pages through users.list (about 3 seconds per 200 users) until the directory ends or this many are scanned; next_cursor is returned if more remain.",
      ),
    cursor: z
      .string()
      .optional()
      .describe("Continue a previous scan from the next_cursor it returned."),
    raw: rawInput,
  }),
  handler: async (client, args, ctx = NO_CONTEXT) => {
    const q = args.query.toLowerCase()
    const matches = []
    let scanned = 0
    let cursor = args.cursor
    do {
      ctx.signal.throwIfAborted()
      const res = await client.users.list({
        limit: Math.min(PAGE_SIZE, args.limit - scanned),
        cursor,
      })
      const members = res.members ?? []
      scanned += members.length
      for (const u of members) {
        const profile = u.profile ?? {}
        const fields = [
          u.id,
          u.name,
          u.real_name,
          profile.display_name,
          profile.real_name,
          profile.email,
        ]
        if (fields.some((f) => typeof f === "string" && f.toLowerCase().includes(q))) {
          matches.push(u)
        }
      }
      cursor = (res.response_metadata ?? {}).next_cursor || undefined
      await ctx.progress(scanned)
    } while (cursor && scanned < args.limit)
    return { matches: shapeAll(args.raw, matches, shapeUser), scanned, next_cursor: cursor }
  },
})

export const usersInfo = defineTool({
  name: "users_info",
  title: "Get user info",
  description: "Gets information about a user.",
  tier: "read",
  scopes: ["users:read"],
  input: z.object({
    user: z.string().describe("User to get info on."),
    include_locale: z
      .boolean()
      .optional()
      .describe("Set this to true to receive the locale for this user."),
    raw: rawInput,
  }),
  handler: async (client, args) => {
    const res = await client.users.info({ user: args.user, include_locale: args.include_locale })
    return { user: args.raw ? res.user : shapeUser(res.user) }
  },
})

export const usersLookupByEmail = defineTool({
  name: "users_lookup_by_email",
  title: "Look up user by email",
  description: "Find a user with an email address.",
  tier: "read",
  scopes: ["users:read.email"],
  input: z.object({
    email: z.string().describe("An email address belonging to a user in the workspace."),
    raw: rawInput,
  }),
  handler: async (client, args) => {
    const res = await client.users.lookupByEmail({ email: args.email })
    return { user: args.raw ? res.user : shapeUser(res.user) }
  },
})
