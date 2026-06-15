import { expect, test } from "bun:test"

import { ALLOW_WRITE_ENV, allowWriteFromEnv, allowWriteWarning } from "@/env"

test("allowWriteFromEnv: on by default; falsy or unrecognized values fail safe to read-only", () => {
  const allow = (value?: string) => allowWriteFromEnv({ [ALLOW_WRITE_ENV]: value })

  // unset/empty keeps the default (on)
  expect(allowWriteFromEnv({})).toBe(true)
  expect(allow(undefined)).toBe(true)
  expect(allow("")).toBe(true)

  // only canonically-truthy values keep writes on
  expect(allow("true")).toBe(true)
  expect(allow("TRUE")).toBe(true)
  expect(allow("1")).toBe(true)

  // explicit falsy disables
  expect(allow("false")).toBe(false)
  expect(allow("FALSE")).toBe(false)
  expect(allow("  false  ")).toBe(false)
  expect(allow("0")).toBe(false)

  // a set-but-unrecognized value fails safe to read-only (does NOT stay on),
  // so a fumbled disable ("yes"/"on"/"no") can't silently leave writes enabled
  expect(allow("yes")).toBe(false)
  expect(allow("on")).toBe(false)
  expect(allow("no")).toBe(false)
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
