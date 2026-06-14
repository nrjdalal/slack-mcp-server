import { z } from "zod"

import { defineTool } from "@/types"

export const usergroupsList = defineTool({
  name: "usergroups_list",
  description: "List the workspace's user groups (subteams).",
  tier: "read",
  scopes: ["usergroups:read"],
  input: z.object({
    include_users: z.boolean().default(false),
    include_disabled: z.boolean().default(false),
  }),
  handler: async (client, args) => {
    const res = await client.usergroups.list({
      include_users: args.include_users,
      include_disabled: args.include_disabled,
    })
    return { usergroups: res.usergroups ?? [] }
  },
})

export const usergroupsMe = defineTool({
  name: "usergroups_me",
  description: "List the user groups the authenticated user belongs to.",
  tier: "read",
  scopes: ["usergroups:read"],
  input: z.object({}),
  handler: async (client) => {
    const me = await client.auth.test()
    const res = await client.usergroups.list({ include_users: true })
    const mine = (res.usergroups ?? []).filter((g) =>
      ((g as { users?: string[] }).users ?? []).includes(me.user_id ?? ""),
    )
    return { usergroups: mine }
  },
})

export const usergroupsCreate = defineTool({
  name: "usergroups_create",
  description: "Create a user group (mention group).",
  tier: "write",
  scopes: ["usergroups:write"],
  input: z.object({
    name: z.string(),
    handle: z.string().optional(),
    description: z.string().optional(),
  }),
  handler: async (client, args) => {
    const res = await client.usergroups.create({
      name: args.name,
      handle: args.handle,
      description: args.description,
    })
    return { usergroup: res.usergroup }
  },
})

export const usergroupsUpdate = defineTool({
  name: "usergroups_update",
  description: "Update a user group's name, handle, or description.",
  tier: "write",
  scopes: ["usergroups:write"],
  input: z.object({
    usergroup: z.string().describe("Usergroup ID (Sxxxx)."),
    name: z.string().optional(),
    handle: z.string().optional(),
    description: z.string().optional(),
  }),
  handler: async (client, args) => {
    const res = await client.usergroups.update({
      usergroup: args.usergroup,
      name: args.name,
      handle: args.handle,
      description: args.description,
    })
    return { usergroup: res.usergroup }
  },
})

export const usergroupsUsersUpdate = defineTool({
  name: "usergroups_users_update",
  description: "Replace all members of a user group (destructive).",
  tier: "write",
  scopes: ["usergroups:write"],
  input: z.object({
    usergroup: z.string(),
    users: z.array(z.string()).describe("Full list of user IDs; replaces existing members."),
  }),
  handler: async (client, args) => {
    const res = await client.usergroups.users.update({
      usergroup: args.usergroup,
      users: args.users.join(","),
    })
    return { usergroup: res.usergroup }
  },
})
