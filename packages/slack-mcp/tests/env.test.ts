import { expect, test } from "bun:test"

import { ALLOW_WRITE_ENV, allowWriteFromEnv } from "@/env"

test("allowWriteFromEnv: only explicit truthy values enable writes", () => {
  const allow = (value?: string) => allowWriteFromEnv({ [ALLOW_WRITE_ENV]: value })

  expect(allowWriteFromEnv({})).toBe(false)
  expect(allow(undefined)).toBe(false)
  expect(allow("")).toBe(false)
  expect(allow("false")).toBe(false)
  expect(allow("0")).toBe(false)
  expect(allow("yes")).toBe(false)

  expect(allow("true")).toBe(true)
  expect(allow("TRUE")).toBe(true)
  expect(allow("  true  ")).toBe(true)
  expect(allow("1")).toBe(true)
})
