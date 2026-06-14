import { z } from "zod"

import { defineTool } from "@/types"

export const usersSearch = defineTool({
  name: "users_search",
  description:
    "Find users by matching a query against id, name, real name, display name, or email (case-insensitive).",
  tier: "read",
  scopes: ["users:read", "users:read.email"],
  input: z.object({
    query: z.string().describe("Substring to match."),
    limit: z.number().int().min(1).max(1000).default(200),
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
