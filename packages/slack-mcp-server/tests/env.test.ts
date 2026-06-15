import { expect, test } from "bun:test"

import { ALLOW_WRITE_ENV, allowWriteFromEnv, allowWriteWarning } from "@/env"

test("allowWriteFromEnv: writes are on by default; only an explicit falsy value disables", () => {
  const allow = (value?: string) => allowWriteFromEnv({ [ALLOW_WRITE_ENV]: value })

  expect(allowWriteFromEnv({})).toBe(true)
  expect(allow(undefined)).toBe(true)
  expect(allow("")).toBe(true)
  expect(allow("true")).toBe(true)
  expect(allow("1")).toBe(true)
  expect(allow("yes")).toBe(true)

  expect(allow("false")).toBe(false)
  expect(allow("FALSE")).toBe(false)
  expect(allow("  false  ")).toBe(false)
  expect(allow("0")).toBe(false)
})

test("allowWriteWarning fires only for set-but-unrecognized values", () => {
  const warn = (value?: string) => allowWriteWarning({ [ALLOW_WRITE_ENV]: value })

  expect(allowWriteWarning({})).toBeUndefined()
  expect(warn(undefined)).toBeUndefined()
  expect(warn("true")).toBeUndefined()
  expect(warn("false")).toBeUndefined()
  expect(warn("")).toBeUndefined()

  expect(warn("yes")).toContain(ALLOW_WRITE_ENV)
  expect(warn("on")).toContain("not recognized")
})
