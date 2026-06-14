export const ALLOW_WRITE_ENV = "SLACK_MCP_ALLOW_WRITE"

const TRUTHY = new Set(["true", "1"])
const FALSY = new Set(["", "false", "0"])

const normalize = (env: NodeJS.ProcessEnv) => env[ALLOW_WRITE_ENV]?.trim().toLowerCase()

// Write-gating policy lives in the server layer: off unless SLACK_MCP_ALLOW_WRITE
// is explicitly truthy ("true" or "1", case-insensitive). Anything else stays read-only.
export const allowWriteFromEnv = (env: NodeJS.ProcessEnv = process.env): boolean =>
  TRUTHY.has(normalize(env) ?? "")

// A set-but-unrecognized value (e.g. "yes", "on") is treated as off; return a
// warning so an operator who expected writes is not left guessing. Pure: the
// caller decides where to surface it.
export const allowWriteWarning = (env: NodeJS.ProcessEnv = process.env): string | undefined => {
  const value = normalize(env)
  if (value === undefined || TRUTHY.has(value) || FALSY.has(value)) return undefined
  return `${ALLOW_WRITE_ENV}="${env[ALLOW_WRITE_ENV]}" is not recognized; writes stay disabled (use "true" to enable).`
}
