import type { WebClient } from "@slack/web-api"
import type { z } from "zod"

export type Tier = "read" | "write"

export interface SlackTool {
  name: string
  description: string
  tier: Tier
  scopes: string[]
  // acts as the bot user when a bot token is configured (see invoke)
  botCapable?: boolean
  input: z.ZodTypeAny
  handler: (client: WebClient, args: Record<string, unknown>) => Promise<unknown>
}

export const defineTool = <I extends z.ZodTypeAny>(tool: {
  name: string
  description: string
  tier: Tier
  scopes: string[]
  botCapable?: boolean
  input: I
  handler: (client: WebClient, args: z.output<I>) => Promise<unknown>
}): SlackTool => tool as unknown as SlackTool
