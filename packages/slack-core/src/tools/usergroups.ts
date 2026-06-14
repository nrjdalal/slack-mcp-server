import { z } from "zod"

import { defineTool } from "@/types"

const channels = z
  .array(z.string())
  .optional()
  .describe("Encoded channel IDs the User Group uses as a default.")
const additionalChannels = z
  .array(z.string())
  .optional()
  .describe("Encoded channel IDs the User Group can custom add usergroup members to.")
const description = z.string().optional().describe("A short description of the User Group.")
const handle = z
  .string()
  .optional()
  .describe("A mention handle. Must be unique among channels, users and User Groups.")
const includeCount = z
  .boolean()
  .optional()
  .describe("Include the number of users in each User Group.")
const enableSection = z
  .boolean()
  .optional()
  .describe("Configure this user group to show as a sidebar section for all group members.")
const teamId = z
  .string()
  .optional()
  .describe("Encoded team id where the user group exists, required if org token is used.")

export const usergroupsList = defineTool({
  name: "usergroups_list",
  description: "List all User Groups for a team.",
  tier: "read",
  scopes: ["usergroups:read"],
  input: z.object({
    include_count: includeCount,
    include_disabled: z.boolean().optional().describe("Include results for disabled User Groups."),
    include_users: z
      .boolean()
      .optional()
      .describe("Include the list of users for each User Group."),
    team_id: z
      .string()
      .optional()
      .describe("The user group's encoded team ID. Required if org token is used."),
  }),
  handler: async (client, args) => {
    const res = await client.usergroups.list({
      include_count: args.include_count,
      include_disabled: args.include_disabled,
      include_users: args.include_users,
      team_id: args.team_id,
    })
    return { usergroups: res.usergroups ?? [] }
  },
})

export const usergroupsMe = defineTool({
  name: "usergroups_me",
  description:
    "List the user groups the authenticated user belongs to. Composite over auth.test and usergroups.list.",
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
  description: "Create a User Group.",
  tier: "write",
  scopes: ["usergroups:write"],
  input: z.object({
    name: z.string().describe("A name for the User Group. Must be unique among User Groups."),
    channels,
    additional_channels: additionalChannels,
    description,
    handle,
    include_count: includeCount,
    team_id: z
      .string()
      .optional()
      .describe(
        "Encoded team id where the user group has to be created, required if org token is used.",
      ),
    enable_section: enableSection,
  }),
  handler: async (client, args) => {
    const res = await client.usergroups.create({
      name: args.name,
      channels: args.channels?.join(","),
      additional_channels: args.additional_channels?.join(","),
      description: args.description,
      handle: args.handle,
      include_count: args.include_count,
      team_id: args.team_id,
      enable_section: args.enable_section,
    } as Parameters<typeof client.usergroups.create>[0])
    return { usergroup: res.usergroup }
  },
})

export const usergroupsUpdate = defineTool({
  name: "usergroups_update",
  description: "Update an existing User Group.",
  tier: "write",
  scopes: ["usergroups:write"],
  input: z.object({
    usergroup: z.string().describe("The encoded ID of the User Group to update."),
    channels,
    additional_channels: additionalChannels,
    description,
    handle,
    include_count: includeCount,
    name: z
      .string()
      .optional()
      .describe("A name for the User Group. Must be unique among User Groups."),
    team_id: teamId,
    enable_section: enableSection,
  }),
  handler: async (client, args) => {
    const res = await client.usergroups.update({
      usergroup: args.usergroup,
      channels: args.channels?.join(","),
      additional_channels: args.additional_channels?.join(","),
      description: args.description,
      handle: args.handle,
      include_count: args.include_count,
      name: args.name,
      team_id: args.team_id,
      enable_section: args.enable_section,
    } as Parameters<typeof client.usergroups.update>[0])
    return { usergroup: res.usergroup }
  },
})

export const usergroupsUsersUpdate = defineTool({
  name: "usergroups_users_update",
  description: "Update the list of users for a user group.",
  tier: "write",
  scopes: ["usergroups:write"],
  input: z.object({
    usergroup: z.string().describe("The encoded ID of the user group to update."),
    users: z
      .array(z.string())
      .describe("Encoded user IDs that represent the entire list of users for the user group."),
    include_count: z
      .boolean()
      .optional()
      .describe("Include the number of users in the user group."),
    team_id: teamId,
    additional_channels: additionalChannels,
    is_shared: z
      .boolean()
      .optional()
      .describe("Identify if the API is called when a shared section is getting shared."),
  }),
  handler: async (client, args) => {
    const res = await client.usergroups.users.update({
      usergroup: args.usergroup,
      users: args.users.join(","),
      include_count: args.include_count,
      team_id: args.team_id,
      additional_channels: args.additional_channels?.join(","),
      is_shared: args.is_shared,
    } as Parameters<typeof client.usergroups.users.update>[0])
    return { usergroup: res.usergroup }
  },
})
