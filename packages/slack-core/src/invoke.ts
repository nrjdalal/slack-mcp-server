import type { WebClient } from "@slack/web-api"

import type { SlackTool } from "@/types"

export const invoke = async (
  tool: SlackTool,
  client: WebClient,
  rawArgs: unknown = {},
): Promise<unknown> => tool.handler(client, tool.input.parse(rawArgs) as Record<string, unknown>)
