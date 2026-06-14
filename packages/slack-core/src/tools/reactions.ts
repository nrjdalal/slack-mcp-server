import { z } from "zod"

import { defineTool } from "@/types"

const target = z.object({
  channel: z.string(),
  timestamp: z.string().describe("Message ts."),
  name: z.string().describe("Emoji name, without colons."),
})

export const reactionsAdd = defineTool({
  name: "reactions_add",
  description: "Add an emoji reaction to a message.",
  tier: "write",
  scopes: ["reactions:write"],
  input: target,
  handler: async (client, args) => {
    await client.reactions.add({
      channel: args.channel,
      timestamp: args.timestamp,
      name: args.name,
    })
    return { ok: true }
  },
})

export const reactionsRemove = defineTool({
  name: "reactions_remove",
  description: "Remove an emoji reaction from a message.",
  tier: "write",
  scopes: ["reactions:write"],
  input: target,
  handler: async (client, args) => {
    await client.reactions.remove({
      channel: args.channel,
      timestamp: args.timestamp,
      name: args.name,
    })
    return { ok: true }
  },
})
