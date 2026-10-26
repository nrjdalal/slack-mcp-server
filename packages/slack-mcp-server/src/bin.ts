#!/usr/bin/env node
import { serveStdio } from "@modelcontextprotocol/server/stdio"
import { createClient } from "@packages/slack-core"

import { allowWriteFromEnv, allowWriteWarning } from "@/env"
import { createServer } from "@/server"

const main = () => {
  const warning = allowWriteWarning()
  if (warning) console.error(`slack-mcp-server: ${warning}`)
  const allowWrite = allowWriteFromEnv()
  // Built before serving so a missing token fails at startup, not on the first request.
  const client = createClient()
  serveStdio(() => createServer({ client, allowWrite }), {
    onerror: (error) => console.error(`slack-mcp-server: ${error.message}`),
  })
  console.error(`slack-mcp-server: listening on stdio (${allowWrite ? "read+write" : "read-only"})`)
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
