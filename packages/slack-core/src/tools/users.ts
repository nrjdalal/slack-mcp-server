import { z } from "zod"

import { defineTool } from "@/types"

export const usersSearch = defineTool({
  name: "users_search",
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
      .max(1000)
      .default(200)
      .describe("The maximum number of users to scan from users.list."),
  }),
  handler: async (client, args) => {
    const res = await client.users.list({ limit: args.limit })
    const q = args.query.toLowerCase()
    const matches = (res.members ?? []).filter((u) =>
      [
        u.id,
        u.name,
        u.real_name,
        u.profile?.display_name,
        u.profile?.real_name,
        u.profile?.email,
      ].some((f) => typeof f === "string" && f.toLowerCase().includes(q)),
    )
    return { matches }
  },
})

export const usersInfo = defineTool({
  name: "users_info",
  description: "Gets information about a user.",
  tier: "read",
  scopes: ["users:read"],
  input: z.object({
    user: z.string().describe("User to get info on."),
    include_locale: z
      .boolean()
      .optional()
      .describe("Set this to true to receive the locale for this user."),
  }),
  handler: async (client, args) => {
    const res = await client.users.info({ user: args.user, include_locale: args.include_locale })
    return { user: res.user }
  },
})

export const usersLookupByEmail = defineTool({
  name: "users_lookup_by_email",
  description: "Find a user with an email address.",
  tier: "read",
  scopes: ["users:read.email"],
  input: z.object({
    email: z.string().describe("An email address belonging to a user in the workspace."),
  }),
  handler: async (client, args) => {
    const res = await client.users.lookupByEmail({ email: args.email })
    return { user: res.user }
  },
})
