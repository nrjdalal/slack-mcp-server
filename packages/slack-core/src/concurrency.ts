// Order-preserving bounded-concurrency map: runs at most `limit` of `fn` at once.
// Used by composite tools that fan out many Slack calls so they stay fast without
// stampeding the per-method rate limits.
export const mapLimit = async <T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> => {
  const results: R[] = []
  results.length = items.length
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const index = next++
      results[index] = await fn(items[index]!, index)
    }
  }
  const size = Math.max(1, Math.min(limit, items.length))
  await Promise.all(Array.from({ length: size }, worker))
  return results
}
