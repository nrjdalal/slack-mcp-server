#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"

import { allowWriteFromEnv, allowWriteWarning } from "@/env"
import { createServer } from "@/server"

const main = async () => {
  const warning = allowWriteWarning()
  if (warning) console.error(`better-slack-mcp: ${warning}`)
  const allowWrite = allowWriteFromEnv()
  const server = createServer({ allowWrite })
  await server.connect(new StdioServerTransport())
  console.error(`better-slack-mcp: listening on stdio (${allowWrite ? "read+write" : "read-only"})`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
