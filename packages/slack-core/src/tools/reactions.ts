import { z } from "zod"

import { defineTool } from "@/types"

export const reactionsAdd = defineTool({
  name: "reactions_add",
  description: "Adds a reaction to an item.",
  tier: "write",
  scopes: ["reactions:write"],
  input: z.object({
    channel: z.string().describe("Channel where the message to add reaction to was posted."),
    name: z.string().describe("Reaction (emoji) name."),
    timestamp: z.string().describe("Timestamp of the message to add reaction to."),
  }),
  handler: async (client, args) => {
    await client.reactions.add({
      channel: args.channel,
      name: args.name,
      timestamp: args.timestamp,
    })
    return { ok: true }
  },
})

export const reactionsRemove = defineTool({
  name: "reactions_remove",
  description: "Removes a reaction from an item.",
  tier: "write",
  scopes: ["reactions:write"],
  input: z.object({
    name: z.string().describe("Reaction (emoji) name."),
    channel: z
      .string()
      .optional()
      .describe("Channel where the message to remove reaction from was posted."),
    timestamp: z.string().optional().describe("Timestamp of the message to remove reaction from."),
    file: z.string().optional().describe("File to remove reaction from."),
    file_comment: z.string().optional().describe("File comment to remove reaction from."),
  }),
  handler: async (client, args) => {
    await client.reactions.remove({
      name: args.name,
      channel: args.channel,
      timestamp: args.timestamp,
      file: args.file,
      file_comment: args.file_comment,
    } as Parameters<typeof client.reactions.remove>[0])
    return { ok: true }
  },
})
