import { z } from "zod"

import { defineTool } from "@/types"

export const listUsers = defineTool({
  name: "list_users",
  alias: "users_list",
  description: "List users in the workspace.",
  tier: "read",
  scopes: ["users:read"],
  input: z.object({
    limit: z.number().int().min(1).max(1000).default(200),
    cursor: z.string().optional(),
  }),
  handler: async (client, args) => {
    const res = await client.users.list({ limit: args.limit, cursor: args.cursor })
    return {
      members: res.members ?? [],
      next_cursor: res.response_metadata?.next_cursor || undefined,
    }
  },
})

export const userInfo = defineTool({
  name: "user_info",
  alias: "users_info",
  description: "Get information about a user by ID.",
  tier: "read",
  scopes: ["users:read"],
  input: z.object({ user: z.string().describe("User ID (Uxxxx).") }),
  handler: async (client, args) => {
    const res = await client.users.info({ user: args.user })
    return { user: res.user }
  },
})

export const userProfile = defineTool({
  name: "user_profile",
  alias: "users_profile_get",
  description: "Get a user's profile. Omit `user` for the authenticated user.",
  tier: "read",
  scopes: ["users.profile:read"],
  input: z.object({ user: z.string().optional() }),
  handler: async (client, args) => {
    const res = await client.users.profile.get({ user: args.user })
    return { profile: res.profile }
  },
})

export const findUserByEmail = defineTool({
  name: "find_user_by_email",
  alias: "users_lookupByEmail",
  description: "Find a user by email address.",
  tier: "read",
  scopes: ["users:read.email"],
  input: z.object({ email: z.string().describe("Email address.") }),
  handler: async (client, args) => {
    const res = await client.users.lookupByEmail({ email: args.email })
    return { user: res.user }
  },
})
