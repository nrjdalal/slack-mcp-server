import { z } from "zod"

import { defineTool } from "@/types"

export const chatPostMessage = defineTool({
  name: "chat_post_message",
  description: "Post a message to a channel, DM, or thread.",
  tier: "write",
  scopes: ["chat:write"],
  input: z.object({
    channel: z.string().describe("Channel ID, DM ID, or #name."),
    text: z.string().describe("Message text (mrkdwn)."),
    thread_ts: z.string().optional().describe("Reply within this thread."),
    reply_broadcast: z.boolean().optional(),
  }),
  handler: async (client, args) => {
    const res = await client.chat.postMessage({
      channel: args.channel,
      text: args.text,
      thread_ts: args.thread_ts,
      reply_broadcast: args.reply_broadcast,
    } as Parameters<typeof client.chat.postMessage>[0])
    return { ts: res.ts, channel: res.channel }
  },
})
