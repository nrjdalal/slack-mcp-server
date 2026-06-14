import { z } from "zod"

import { defineTool } from "@/types"

export const listEmoji = defineTool({
  name: "list_emoji",
  alias: "emoji_list",
  description: "List the workspace's custom emoji.",
  tier: "read",
  scopes: ["emoji:read"],
  input: z.object({}),
  handler: async (client) => {
    const res = await client.emoji.list()
    return { emoji: res.emoji ?? {} }
  },
})

export const teamInfo = defineTool({
  name: "team_info",
  description: "Get information about the current Slack workspace.",
  tier: "read",
  scopes: ["team:read"],
  input: z.object({}),
  handler: async (client) => {
    const res = await client.team.info()
    return { team: res.team }
  },
})
