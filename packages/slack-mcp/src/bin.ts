#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"

import { createServer } from "@/server"

const main = async () => {
  const server = createServer()
  await server.connect(new StdioServerTransport())
  console.error("better-slack-mcp: listening on stdio")
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
