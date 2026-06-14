import { WebClient } from "@slack/web-api"

export const TOKEN_ENV = "SLACK_MCP_XOXP_TOKEN"

// Track each client's token so tools (e.g. files_info) can authenticate raw
// file downloads without reaching into @slack/web-api internals.
const tokens = new WeakMap<WebClient, string>()

export const createClient = (token = process.env[TOKEN_ENV]): WebClient => {
  if (!token) {
    throw new Error(`${TOKEN_ENV} is not set`)
  }
  const client = new WebClient(token)
  tokens.set(client, token)
  return client
}

export const getToken = (client: WebClient): string | undefined =>
  tokens.get(client) ?? process.env[TOKEN_ENV]
