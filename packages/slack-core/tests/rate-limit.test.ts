import { expect, test } from "bun:test"

import {
  createRateLimitInterceptor,
  createTokenBucket,
  SPECIAL,
  TIER_2,
  TIER_3,
  TIER_4,
  tierForMethod,
} from "@/rate-limit"

test("tierForMethod resolves the documented (scraped) tier, defaulting to Tier 3", () => {
  expect(tierForMethod("conversations.list")).toBe(TIER_2) // Tier 2
  expect(tierForMethod("search.messages")).toBe(TIER_2) // Tier 2
  expect(tierForMethod("conversations.history")).toBe(TIER_3) // Tier 3
  expect(tierForMethod("files.info")).toBe(TIER_4) // Tier 4
  expect(tierForMethod("chat.postMessage")).toBe(SPECIAL) // Special
  expect(tierForMethod("anything.unknown")).toBe(TIER_3) // fallback
})

test("token bucket grants the burst immediately, then paces by interval", async () => {
  const bucket = createTokenBucket({ intervalMs: 60, burst: 3 })
  const start = Date.now()
  const at: number[] = []
  for (let i = 0; i < 5; i++) {
    await bucket.acquire()
    at.push(Date.now() - start)
  }
  // first 3 (the burst) are effectively immediate
  expect(at[2]!).toBeLessThan(50)
  // 4th and 5th are spaced ~intervalMs apart
  expect(at[3]!).toBeGreaterThanOrEqual(45)
  expect(at[4]! - at[3]!).toBeGreaterThanOrEqual(45)
})

test("token bucket serializes concurrent acquires (no double-spend)", async () => {
  const bucket = createTokenBucket({ intervalMs: 60, burst: 2 })
  const start = Date.now()
  await Promise.all(Array.from({ length: 4 }, () => bucket.acquire()))
  // 2 immediate + 2 paced => at least ~2 intervals elapsed
  expect(Date.now() - start).toBeGreaterThanOrEqual(90)
})

test("interceptor paces per method and returns the config unchanged", async () => {
  const intercept = createRateLimitInterceptor()
  const cfg = { url: "conversations.history" } as Parameters<typeof intercept>[0]
  const start = Date.now()
  // Tier 3 burst is 4; the 5th call to the same method must wait.
  for (let i = 0; i < 5; i++) {
    const out = await intercept(cfg)
    expect(out).toBe(cfg)
  }
  expect(Date.now() - start).toBeGreaterThanOrEqual(900)
})
