import type { WebClientOptions } from "@slack/web-api"

import methodTiers from "@/tiers.json"

// Proactive, per-method rate limiting. Slack rate-limits each Web API method
// independently, so we keep one token bucket per method, sized by its documented
// tier. Wired as a WebClient request interceptor, it paces every outbound call -
// including the internal calls of composite tools - and complements (does not
// replace) @slack/web-api's reactive Retry-After handling.

export interface Tier {
  intervalMs: number
  burst: number
}

// Slack's documented tiers (requests/min) expressed as a min interval + burst.
// See https://docs.slack.dev/apis/web-api/rate-limits.
export const TIER_1: Tier = { intervalMs: 60_000, burst: 1 } // 1+/min
export const TIER_2: Tier = { intervalMs: 3_000, burst: 3 } // 20+/min
export const TIER_3: Tier = { intervalMs: 1_200, burst: 4 } // 50+/min
export const TIER_4: Tier = { intervalMs: 600, burst: 5 } // 100+/min
export const SPECIAL: Tier = { intervalMs: 1_000, burst: 1 } // e.g. chat.postMessage ~1/sec

const TIER_CONFIG: Record<string, Tier> = {
  "Tier 1": TIER_1,
  "Tier 2": TIER_2,
  "Tier 3": TIER_3,
  "Tier 4": TIER_4,
  Special: SPECIAL,
}

// method -> documented tier label, scraped from docs.slack.dev and generated
// into tiers.json (see scripts/gen-docs.ts). Unknown/untiered methods fall back
// to the conservative Tier 3.
const METHOD_TIER = methodTiers as Record<string, string>

export const tierForMethod = (method: string): Tier =>
  TIER_CONFIG[METHOD_TIER[method] ?? ""] ?? TIER_3

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export interface TokenBucket {
  acquire: () => Promise<void>
}

// Token bucket: up to `burst` immediate grants, then one grant per `intervalMs`.
// Acquires are serialized through a promise chain so concurrent callers cannot
// double-spend a token.
export const createTokenBucket = ({ intervalMs, burst }: Tier): TokenBucket => {
  let tokens = burst
  let last = Date.now()
  let chain: Promise<void> = Promise.resolve()

  const take = async (): Promise<void> => {
    const now = Date.now()
    tokens = Math.min(burst, tokens + (now - last) / intervalMs)
    last = now
    if (tokens >= 1) {
      tokens -= 1
      return
    }
    const waitMs = (1 - tokens) * intervalMs
    await sleep(waitMs)
    last = Date.now()
    tokens = 0
  }

  return {
    acquire: () => {
      const next = chain.then(take)
      chain = next.catch(() => {})
      return next
    },
  }
}

// One lazily-created bucket per method, returned as a WebClient requestInterceptor.
export const createRateLimitInterceptor = (): NonNullable<
  WebClientOptions["requestInterceptor"]
> => {
  const buckets = new Map<string, TokenBucket>()
  return async (config) => {
    const method = (config.url ?? "").split("/").pop() ?? ""
    let bucket = buckets.get(method)
    if (!bucket) {
      bucket = createTokenBucket(tierForMethod(method))
      buckets.set(method, bucket)
    }
    // Note: this runs inside @slack/web-api's maxRequestConcurrency queue, so the
    // wait holds a concurrency slot. Benign here - composite fan-out is bounded
    // and tool calls are largely sequential - and the SDK exposes no pre-queue hook.
    await bucket.acquire()
    return config
  }
}
