export const ALLOW_WRITE_ENV = "SLACK_MCP_ALLOW_WRITE"

// Write-gating policy lives in the server layer: off unless SLACK_MCP_ALLOW_WRITE
// is explicitly truthy ("true" or "1", case-insensitive). Anything else stays read-only.
export const allowWriteFromEnv = (env: NodeJS.ProcessEnv = process.env): boolean => {
  const value = env[ALLOW_WRITE_ENV]?.trim().toLowerCase()
  return value === "true" || value === "1"
}
