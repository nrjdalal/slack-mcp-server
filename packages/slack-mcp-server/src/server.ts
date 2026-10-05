import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { createBotClient, createClient, enabledTools, invoke } from "@packages/slack-core"
import type { WebClient } from "@slack/web-api"

import { version } from "../package.json"

export interface CreateServerOptions {
  client?: WebClient
  botClient?: WebClient
  allowWrite?: boolean
}

// Wraps the slack-core registry in an McpServer. Writes are enabled by default;
// pass allowWrite: false to expose only the read-only tools. A botClient (from
// SLACK_MCP_XOXB_TOKEN by default) makes bot-capable tools act as the bot.
export const createServer = ({
  client = createClient(),
  botClient = createBotClient(),
  allowWrite = true,
}: CreateServerOptions = {}): McpServer => {
  const server = new McpServer({ name: "slack-mcp-server", version })

  for (const tool of enabledTools(allowWrite)) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        // pass the whole Zod object; @modelcontextprotocol/sdk >=1.29 accepts a
        // full schema via its AnySchema branch (older SDKs need a ZodRawShape).
        inputSchema: tool.input,
        annotations: { readOnlyHint: tool.tier === "read" },
      },
      async (args) => {
        const result = await invoke(tool, client, args, { botClient })
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }] }
      },
    )
  }

  return server
}
