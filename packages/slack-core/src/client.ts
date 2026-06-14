import { WebClient, type WebClientOptions } from "@slack/web-api"

export const TOKEN_ENV = "SLACK_MCP_XOXP_TOKEN"

// @slack/web-api already honours 429 `Retry-After` (it sleeps for the advertised
// delay, then retries) and bounds concurrency. We set both explicitly and tune
// them for an interactive MCP server: the default policy retries up to 10 times
// over ~30 min, which would silently block a tool call. Since 2025-05-29
// non-Marketplace apps are throttled to ~1 req/min on conversations.history /
// .replies, so we cap retries low and let a persistent rate limit surface as an
// error the caller can act on. See https://docs.slack.dev/apis/web-api/rate-limits.
const RETRY_CONFIG = {
  retries: 3,
  factor: 2,
  minTimeout: 1_000,
  maxTimeout: 30_000,
  randomize: true,
}
const MAX_REQUEST_CONCURRENCY = 8

// Track each client's token so tools (e.g. files_info) can authenticate raw
// file downloads without reaching into @slack/web-api internals.
const tokens = new WeakMap<WebClient, string>()

export const createClient = (
  token = process.env[TOKEN_ENV],
  options: WebClientOptions = {},
): WebClient => {
  if (!token) {
    throw new Error(`${TOKEN_ENV} is not set`)
  }
  const client = new WebClient(token, {
    retryConfig: RETRY_CONFIG,
    maxRequestConcurrency: MAX_REQUEST_CONCURRENCY,
    ...options,
  })
  tokens.set(client, token)
  return client
}

export const getToken = (client: WebClient): string | undefined =>
  tokens.get(client) ?? process.env[TOKEN_ENV]
