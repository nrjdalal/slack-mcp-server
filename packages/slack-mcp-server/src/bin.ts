#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { createBotClient } from "@packages/slack-core"

import { allowWriteFromEnv, allowWriteWarning } from "@/env"
import { createServer } from "@/server"

const main = async () => {
  const warning = allowWriteWarning()
  if (warning) console.error(`slack-mcp-server: ${warning}`)
  const allowWrite = allowWriteFromEnv()
  const botClient = createBotClient()
  const server = createServer({ allowWrite, botClient })
  await server.connect(new StdioServerTransport())
  const mode = allowWrite ? "read+write" : "read-only"
  const bot = allowWrite && botClient ? ", posting as bot" : ""
  console.error(`slack-mcp-server: listening on stdio (${mode}${bot})`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
