import type { WebClient } from "@slack/web-api"
import type { z } from "zod"

export type Tier = "read" | "write"

export interface SlackTool {
  name: string
  alias?: string
  description: string
  tier: Tier
  scopes: string[]
  input: z.ZodTypeAny
  handler: (client: WebClient, args: Record<string, unknown>) => Promise<unknown>
}

export const defineTool = <I extends z.ZodTypeAny>(tool: {
  name: string
  alias?: string
  description: string
  tier: Tier
  scopes: string[]
  input: I
  handler: (client: WebClient, args: z.output<I>) => Promise<unknown>
}): SlackTool => tool as unknown as SlackTool
