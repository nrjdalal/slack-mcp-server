import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

import { allTools, readTools } from "@/registry"
import type { SlackTool } from "@/types"

// repo root: tests -> slack-core -> packages -> root
const ROOT = `${import.meta.dir}/../../..`
const uniq = (tools: SlackTool[]) => [...new Set(tools.flatMap((t) => t.scopes))].sort()

// parse the `user:` scope list out of a manifest yaml
const manifestScopes = (file: string) =>
  readFileSync(`${ROOT}/${file}`, "utf8")
    .split("\n")
    .filter((l) => /^\s+-\s/.test(l))
    .map((l) => l.replace(/^\s+-\s*/, "").trim())
    .sort()

test("manifest.readonly.yaml is in sync with readTools scopes", () => {
  expect(manifestScopes("manifest.readonly.yaml")).toEqual(uniq(readTools))
})

test("manifest.full.yaml is in sync with allTools scopes", () => {
  expect(manifestScopes("manifest.full.yaml")).toEqual(uniq(allTools))
})
