import type { WebClient } from "@slack/web-api"

import { resolveChannel, resolveUser } from "@/resolve"
import type { SlackTool } from "@/types"

export const invoke = async (
  tool: SlackTool,
  client: WebClient,
  rawArgs: unknown = {},
): Promise<unknown> => {
  const args = tool.input.parse(rawArgs) as Record<string, unknown>
  // transparently resolve #channel / @handle refs to IDs; ID inputs pass through
  // untouched (and never hit the cache).
  if (typeof args.channel === "string") args.channel = await resolveChannel(client, args.channel)
  if (typeof args.user === "string") args.user = await resolveUser(client, args.user)
  if (typeof args.users === "string") {
    args.users = (
      await Promise.all(args.users.split(",").map((u) => resolveUser(client, u.trim())))
    ).join(",")
  }
  return tool.handler(client, args)
}
