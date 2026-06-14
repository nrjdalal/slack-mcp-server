import { expect, test } from "bun:test"

import { mapLimit } from "@/concurrency"

const tick = (ms = 5) => new Promise((resolve) => setTimeout(resolve, ms))

test("mapLimit preserves input order regardless of completion order", async () => {
  const out = await mapLimit([10, 1, 5], 3, async (n) => {
    await tick(n)
    return n * 2
  })
  expect(out).toEqual([20, 2, 10])
})

test("mapLimit never runs more than `limit` tasks at once", async () => {
  let active = 0
  let peak = 0
  await mapLimit(
    Array.from({ length: 12 }, (_, i) => i),
    3,
    async () => {
      active++
      peak = Math.max(peak, active)
      await tick()
      active--
    },
  )
  expect(peak).toBe(3)
})

test("mapLimit handles empty input and over-large limits", async () => {
  expect(await mapLimit([], 5, async () => 1)).toEqual([])
  expect(await mapLimit([1, 2], 100, async (n) => n + 1)).toEqual([2, 3])
})
