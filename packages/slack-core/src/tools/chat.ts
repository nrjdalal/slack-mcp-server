import { z } from "zod"

import { defineTool } from "@/types"

export const chatPostMessage = defineTool({
  name: "chat_post_message",
  description: "Sends a message to a channel.",
  tier: "write",
  scopes: ["chat:write"],
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
    as_user: z
      .boolean()
      .optional()
      .describe(
        "(Legacy) Pass true to post the message as the authed user. Can only be used by classic apps.",
      ),
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
  input: z.object({
    channel: z.string().describe("Channel containing the message to be updated."),
    ts: z.string().describe("Timestamp of the message to be updated."),
    text: z.string().optional().describe("New text for the message, using the default formatting."),
    blocks: z.array(z.unknown()).optional().describe("An array of structured blocks."),
    attachments: z.array(z.unknown()).optional().describe("An array of structured attachments."),
    markdown_text: z
      .string()
      .optional()
      .describe(
        "Accepts message text formatted in markdown. Should not be used with blocks or text.",
      ),
    link_names: z.boolean().optional().describe("Find and link channel names and usernames."),
    parse: z.string().optional().describe("Change how messages are treated."),
    reply_broadcast: z
      .boolean()
      .optional()
      .describe(
        "Broadcast an existing thread reply to make it visible to everyone in the channel.",
      ),
    metadata: z
      .unknown()
      .optional()
      .describe("JSON object with event_type and event_payload fields."),
  }),
  handler: async (client, args) => {
    const res = await client.chat.update(args as Parameters<typeof client.chat.update>[0])
    return { ts: res.ts, channel: res.channel, text: res.text }
  },
})

export const chatScheduleMessage = defineTool({
  name: "chat_schedule_message",
  description: "Schedules a message to be sent to a channel at a future time.",
  tier: "write",
  scopes: ["chat:write"],
  input: z.object({
    channel: z.string().describe("Channel, private group, or DM channel to send the message to."),
    post_at: z
      .number()
      .int()
      .describe("Unix timestamp representing the future time the message should post to Slack."),
    text: z.string().optional().describe("How this field works depends on other fields you use."),
    blocks: z.array(z.unknown()).optional().describe("An array of structured blocks."),
    attachments: z.array(z.unknown()).optional().describe("An array of structured attachments."),
    markdown_text: z.string().optional().describe("Accepts message text formatted in markdown."),
    thread_ts: z
      .string()
      .optional()
      .describe("Provide another message's ts value to make this message a reply."),
    reply_broadcast: z
      .boolean()
      .optional()
      .describe("Used with thread_ts; make the reply visible to everyone in the channel."),
    parse: z.string().optional().describe("Change how messages are treated."),
    link_names: z.boolean().optional().describe("Find and link channel names and usernames."),
    unfurl_links: z.boolean().optional().describe("Pass true to enable unfurling of text content."),
    unfurl_media: z
      .boolean()
      .optional()
      .describe("Pass false to disable unfurling of media content."),
    metadata: z
      .unknown()
      .optional()
      .describe("JSON object with event_type and event_payload fields."),
  }),
  handler: async (client, args) => {
    const res = await client.chat.scheduleMessage(
      args as Parameters<typeof client.chat.scheduleMessage>[0],
    )
    return {
      scheduled_message_id: res.scheduled_message_id,
      channel: res.channel,
      post_at: res.post_at,
    }
  },
})

export const chatDeleteScheduledMessage = defineTool({
  name: "chat_delete_scheduled_message",
  description: "Deletes a pending scheduled message from the queue.",
  tier: "write",
  scopes: ["chat:write"],
  input: z.object({
    channel: z.string().describe("The channel the scheduled message is posting to."),
    scheduled_message_id: z
      .string()
      .describe("The scheduled_message_id returned from a call to chat.scheduleMessage."),
    as_user: z.boolean().optional().describe("Pass true to delete the message as the authed user."),
  }),
  handler: async (client, args) => {
    await client.chat.deleteScheduledMessage(
      args as Parameters<typeof client.chat.deleteScheduledMessage>[0],
    )
    return { ok: true }
  },
})
