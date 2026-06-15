// Generates the Slack app manifests (JSON) from the tool definitions so the
// requested OAuth scopes can never drift from what the tools actually call.
// Slack's "Create New App -> From a manifest" flow accepts JSON manifests.
//
//   bun scripts/gen-manifests.ts            # write manifest.{full,readonly}.json
//   bun scripts/gen-manifests.ts --check    # exit 1 if either file is out of sync
import { readFileSync, writeFileSync } from "node:fs"

import { allTools, readTools } from "../packages/slack-core/src/registry"
import type { SlackTool } from "../packages/slack-core/src/types"

const ROOT = new URL("..", import.meta.url).pathname

const uniq = (tools: SlackTool[]) => [...new Set(tools.flatMap((t) => t.scopes))].sort()
const readScopes = uniq(readTools)
const fullScopes = uniq(allTools)
const writeScopes = fullScopes.filter((s) => !readScopes.includes(s))

const settings = {
  org_deploy_enabled: false,
  socket_mode_enabled: false,
  token_rotation_enabled: false,
}

// Scopes are listed alphabetically (uniq sorts), so the manifests diff cleanly.
const manifest = (name: string, description: string, userScopes: string[]) => ({
  display_information: { name, description, background_color: "#0b1221" },
  oauth_config: { scopes: { user: userScopes } },
  settings,
})

const readonly = manifest(
  "slack-mcp-server (read-only)",
  "Read-only personal Slack MCP server (user token)",
  readScopes,
)

const full = manifest(
  "slack-mcp-server",
  "Personal, per-workspace Slack MCP server (user token)",
  fullScopes,
)

const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`

const files: ReadonlyArray<readonly [string, string]> = [
  [`${ROOT}manifest.readonly.json`, json(readonly)],
  [`${ROOT}manifest.full.json`, json(full)],
]

if (import.meta.main) {
  const check = process.argv.includes("--check")
  let drift = false
  for (const [path, content] of files) {
    if (check) {
      const onDisk = readFileSync(path, "utf8")
      if (onDisk !== content) {
        drift = true
        console.error(`out of sync: ${path}`)
      }
    } else {
      writeFileSync(path, content)
      console.log(`wrote ${path}`)
    }
  }
  if (check && drift) {
    console.error('manifests are out of sync with the tools; run "bun gen:manifests"')
    process.exit(1)
  }
  if (check) console.log("manifests in sync")
}

export { fullScopes, readScopes, writeScopes }
