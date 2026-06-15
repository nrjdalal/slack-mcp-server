import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

import { allTools, readTools } from "@/registry"
import type { SlackTool } from "@/types"

// repo root: tests -> slack-core -> packages -> root
const ROOT = `${import.meta.dir}/../../..`
const uniq = (tools: SlackTool[]) => [...new Set(tools.flatMap((t) => t.scopes))].sort()

// pull the user scope list out of a JSON manifest
const manifestScopes = (file: string): string[] => {
  const m = JSON.parse(readFileSync(`${ROOT}/${file}`, "utf8")) as {
    oauth_config: { scopes: { user: string[] } }
  }
  return [...m.oauth_config.scopes.user].sort()
}

test("manifest.readonly.json is in sync with readTools scopes", () => {
  expect(manifestScopes("manifest.readonly.json")).toEqual(uniq(readTools))
})

test("manifest.full.json is in sync with allTools scopes", () => {
  expect(manifestScopes("manifest.full.json")).toEqual(uniq(allTools))
})
