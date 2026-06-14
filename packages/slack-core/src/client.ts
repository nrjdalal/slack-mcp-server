import { WebClient } from "@slack/web-api"

export const TOKEN_ENV = "SLACK_MCP_XOXP_TOKEN"

export const createClient = (token = process.env[TOKEN_ENV]): WebClient => {
  if (!token) {
    throw new Error(`${TOKEN_ENV} is not set`)
  }
  return new WebClient(token)
}
