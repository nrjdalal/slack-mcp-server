import { McpServer, type ServerContext, type ToolAnnotations } from "@modelcontextprotocol/server"
import {
  createClient,
  enabledTools,
  invoke,
  type SlackTool,
  type ToolContext,
} from "@packages/slack-core"
import type { WebClient } from "@slack/web-api"

import { version } from "../package.json"

export interface CreateServerOptions {
  client?: WebClient
  allowWrite?: boolean
}

const INSTRUCTIONS =
  "Slack Web API tools acting as the user who owns the token. Channel and user arguments take IDs, #channel names or @handles. Lists return next_cursor while more remain; pass it back as cursor. conversations_unreads and fetch_all make one rate-limited call per channel or page, so keep them small."

const annotationsFor = (tool: SlackTool): ToolAnnotations =>
  tool.tier === "read"
    ? { title: tool.title, readOnlyHint: true, openWorldHint: true }
    : {
        title: tool.title,
        readOnlyHint: false,
        destructiveHint: tool.destructive ?? true,
        idempotentHint: tool.idempotent ?? false,
        openWorldHint: true,
      }

// Cancellation arrives on the request's signal; progress is sent only when the client asked for it with a progress token, and a failed send never fails the call.
const toolContext = (ctx: ServerContext): ToolContext => {
  const meta = ctx.mcpReq._meta
  const progressToken = meta ? meta.progressToken : undefined
  return {
    signal: ctx.mcpReq.signal,
    progress: async (progress, total) => {
      if (progressToken === undefined) return
      try {
        await ctx.mcpReq.notify({
          method: "notifications/progress",
          params: { progressToken, progress, total },
        })
      } catch {
        return
      }
    },
  }
}

// Wraps the slack-core registry in an McpServer. Writes are enabled by default;
// pass allowWrite: false to expose only the read-only tools.
export const createServer = ({
  client = createClient(),
  allowWrite = true,
}: CreateServerOptions = {}): McpServer => {
  const server = new McpServer(
    { name: "slack-mcp-server", version },
    {
      instructions: allowWrite
        ? INSTRUCTIONS
        : `${INSTRUCTIONS} This server is read-only: write tools are disabled.`,
    },
  )

  for (const tool of enabledTools(allowWrite)) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.input,
        annotations: annotationsFor(tool),
      },
      async (args, ctx) => {
        const result = await invoke(tool, client, args, toolContext(ctx))
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }] }
      },
    )
  }

  return server
}
