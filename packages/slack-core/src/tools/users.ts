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
