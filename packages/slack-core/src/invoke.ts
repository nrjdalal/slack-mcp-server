import type { WebClient } from "@slack/web-api"

import { resolveChannel, resolveUser } from "@/resolve"
import type { SlackTool } from "@/types"

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
  return tool.handler(client, args)
}
