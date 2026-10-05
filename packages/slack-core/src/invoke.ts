import type { WebClient } from "@slack/web-api"
import { z } from "zod"

import { BOT_TOKEN_ENV } from "@/client"
import { resolveChannel, resolveUser } from "@/resolve"
import type { SlackTool } from "@/types"

export const asUser = z
  .boolean()
  .optional()
  .describe(
    `Act as the authed user even when ${BOT_TOKEN_ENV} is set (e.g. to edit a message posted before the bot existed). Without a bot token every call already acts as the user.`,
  )

export interface InvokeOptions {
  botClient?: WebClient
}

type Resolver = (client: WebClient, ref: string) => Promise<string>

// Resolve a string or string[] arg; other shapes (undefined, etc.) pass through.
const resolveArg = async (
  client: WebClient,
  value: unknown,
  resolve: Resolver,
): Promise<unknown> => {
  if (typeof value === "string") return resolve(client, value)
  if (Array.isArray(value)) {
    return Promise.all(value.map((v) => (typeof v === "string" ? resolve(client, v) : v)))
  }
  return value
}

const CHANNEL_ARGS = ["channel", "channels", "additional_channels"]
const USER_ARGS = ["user", "users"]

export const invoke = async (
  tool: SlackTool,
  client: WebClient,
  rawArgs: unknown = {},
  { botClient }: InvokeOptions = {},
): Promise<unknown> => {
  const args = tool.input.parse(rawArgs) as Record<string, unknown>
  // transparently resolve #channel / @handle refs (string or array) to IDs;
  // ID inputs pass through untouched and never hit the cache.
  for (const key of CHANNEL_ARGS) {
    if (key in args) args[key] = await resolveArg(client, args[key], resolveChannel)
  }
  for (const key of USER_ARGS) {
    if (key in args) args[key] = await resolveArg(client, args[key], resolveUser)
  }
  if (!tool.botCapable) return tool.handler(client, args)
  // refs above always resolve on the user token; only the call itself switches
  // to the bot, and as_user is consumed here rather than sent to Slack.
  const { as_user: actAsUser, ...rest } = args
  return tool.handler(botClient && actAsUser !== true ? botClient : client, rest)
}
