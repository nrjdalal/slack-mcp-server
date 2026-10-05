import { z } from "zod"

import { asUser } from "@/invoke"
import { defineTool } from "@/types"

export const chatPostMessage = defineTool({
  name: "chat_post_message",
  description: "Sends a message to a channel.",
  tier: "write",
  scopes: ["chat:write"],
  botCapable: true,
  input: z.object({
    channel: z
      .string()
      .describe(
        "An encoded ID or channel name that represents a channel, private group, or IM channel to send the message to.",
      ),
    text: z
      .string()
      .optional()
      .describe(
        "How this field works and whether it is required depends on other fields you use in your API call.",
      ),
    blocks: z.array(z.unknown()).optional().describe("An array of structured blocks."),
    attachments: z.array(z.unknown()).optional().describe("An array of structured attachments."),
    markdown_text: z
      .string()
      .optional()
      .describe(
        "Accepts message text formatted in markdown. Should not be used with blocks or text. Limit to 12,000 characters.",
      ),
    thread_ts: z
      .string()
      .optional()
      .describe(
        "Provide another message's ts value to make this message a reply. Use the parent's ts, not a reply's.",
      ),
    reply_broadcast: z
      .boolean()
      .optional()
      .describe(
        "Used with thread_ts; indicates whether the reply should be made visible to everyone in the channel. Defaults to false.",
      ),
    mrkdwn: z
      .boolean()
      .optional()
      .describe("Disable Slack markup parsing by setting to false. Enabled by default."),
    parse: z.string().optional().describe("Change how messages are treated."),
    link_names: z.boolean().optional().describe("Find and link user groups."),
    unfurl_links: z
      .boolean()
      .optional()
      .describe("Pass true to enable unfurling of primarily text-based content."),
    unfurl_media: z
      .boolean()
      .optional()
      .describe("Pass false to disable unfurling of media content."),
    metadata: z
      .unknown()
      .optional()
      .describe("JSON object with event_type and event_payload fields."),
    icon_emoji: z
      .string()
      .optional()
      .describe("Emoji to use as the icon for this message. Overrides icon_url."),
    icon_url: z
      .string()
      .optional()
      .describe("URL to an image to use as the icon for this message."),
    username: z.string().optional().describe("Set your bot's user name."),
    as_user: asUser,
  }),
  handler: async (client, args) => {
    const res = await client.chat.postMessage(args as Parameters<typeof client.chat.postMessage>[0])
    return { ts: res.ts, channel: res.channel }
  },
})

export const chatUpdate = defineTool({
  name: "chat_update",
  description: "Updates a message.",
  tier: "write",
  scopes: ["chat:write"],
  botCapable: true,
  input: z.object({
    channel: z
      .string()
      .describe(
        "Channel containing the message to be updated. For direct messages, use the DM ID (starts with D), not a user ID.",
      ),
    ts: z.string().describe("Timestamp of the message to be updated."),
    text: z
      .string()
      .optional()
      .describe(
        "How this field works and whether it is required depends on other fields you use in your API call.",
      ),
    blocks: z
      .array(z.unknown())
      .optional()
      .describe(
        "An array of structured blocks. Omit to keep the message's previous blocks; pass an empty array to remove them.",
      ),
    attachments: z
      .array(z.unknown())
      .optional()
      .describe(
        "An array of structured attachments. Omit to keep the message's previous attachments; pass an empty array to remove them.",
      ),
    markdown_text: z
      .string()
      .optional()
      .describe(
        "Accepts message text formatted in markdown. Should not be used with blocks or text. Limit to 12,000 characters.",
      ),
    reply_broadcast: z
      .boolean()
      .optional()
      .describe(
        "Broadcast an existing thread reply to make it visible to everyone in the channel or conversation.",
      ),
    parse: z
      .string()
      .optional()
      .describe("Change how messages are treated. Defaults to client, unlike chat.postMessage."),
    link_names: z.boolean().optional().describe("Find and link channel names and usernames."),
    metadata: z
      .unknown()
      .optional()
      .describe(
        "JSON object with event_type and event_payload fields. Omit to keep the message's previous metadata.",
      ),
    as_user: asUser,
  }),
  handler: async (client, args) => {
    const res = await client.chat.update(args as Parameters<typeof client.chat.update>[0])
    return { ts: res.ts, channel: res.channel }
  },
})

export const chatDelete = defineTool({
  name: "chat_delete",
  description: "Deletes a message.",
  tier: "write",
  scopes: ["chat:write"],
  botCapable: true,
  input: z.object({
    channel: z
      .string()
      .describe(
        "Channel containing the message to be deleted. For direct messages, use the DM ID (starts with D), not a user ID.",
      ),
    ts: z.string().describe("Timestamp of the message to be deleted."),
    as_user: asUser,
  }),
  handler: async (client, args) => {
    const res = await client.chat.delete({ channel: args.channel, ts: args.ts })
    return { ts: res.ts, channel: res.channel }
  },
})
