import type { WebClient } from "@slack/web-api"
import type { z } from "zod"

export type Tier = "read" | "write"

// Per-call hooks a long-running handler uses: stop when the client cancels, and report progress so clients that extend their timeout on progress keep waiting.
export interface ToolContext {
  signal: AbortSignal
  progress: (done: number, total?: number) => Promise<void>
}

// What a handler gets when nothing drives it, a direct call or a test: never cancelled, progress goes nowhere.
export const NO_CONTEXT: ToolContext = {
  signal: new AbortController().signal,
  progress: async () => {},
}

export interface SlackTool {
  name: string
  title: string
  description: string
  tier: Tier
  scopes: string[]
  // Write tools only: whether a call can remove or overwrite existing state, and whether repeating it with the same arguments changes nothing further.
  destructive?: boolean
  idempotent?: boolean
  input: z.ZodTypeAny
  handler: (client: WebClient, args: Record<string, unknown>, ctx?: ToolContext) => Promise<unknown>
}

export const defineTool = <I extends z.ZodTypeAny>(tool: {
  name: string
  title: string
  description: string
  tier: Tier
  scopes: string[]
  destructive?: boolean
  idempotent?: boolean
  input: I
  handler: (client: WebClient, args: z.output<I>, ctx?: ToolContext) => Promise<unknown>
}): SlackTool => tool as unknown as SlackTool
