import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

import { buildDocs } from "../../../scripts/gen-docs"

// repo root: tests -> slack-core -> packages -> root
const ROOT = `${import.meta.dir}/../../..`
const docs = buildDocs()

test("README.md is in sync with the generator", () => {
  expect(readFileSync(`${ROOT}/README.md`, "utf8")).toBe(docs.readme)
})

test("docs/coverage.md is in sync with the generator", () => {
  expect(readFileSync(`${ROOT}/docs/coverage.md`, "utf8")).toBe(docs.coverage)
})

test("packages/slack-core/src/tiers.json is in sync with the generator", () => {
  expect(readFileSync(`${ROOT}/packages/slack-core/src/tiers.json`, "utf8")).toBe(docs.tiers)
})
