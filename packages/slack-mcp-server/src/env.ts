export const ALLOW_WRITE_ENV = "SLACK_MCP_ALLOW_WRITE"

const TRUTHY = new Set(["true", "1"])
const FALSY = new Set(["false", "0"])

const normalize = (env: NodeJS.ProcessEnv) => env[ALLOW_WRITE_ENV]?.trim().toLowerCase()

// Write-gating policy lives in the server layer: writes are ENABLED by default.
// Unset or empty keeps writes on. An explicit value enables writes only when it
// is canonically truthy ("true"/"1"); any other set value -- a falsy "false"/"0"
// or an unrecognized "no"/"off" -- fails SAFE to read-only. Setting the variable
// at all signals intent to control the gate, so ambiguity resolves toward less
// privilege: a fumbled disable can never silently leave writes on.
export const allowWriteFromEnv = (env: NodeJS.ProcessEnv = process.env): boolean => {
  const value = normalize(env)
  return value === undefined || value === "" || TRUTHY.has(value)
}

// A set-but-unrecognized value (e.g. "no", "off") fails safe to read-only; return
// a warning so an operator who expected writes is not left guessing. Pure: the
// caller decides where to surface it.
export const allowWriteWarning = (env: NodeJS.ProcessEnv = process.env): string | undefined => {
  const value = normalize(env)
  if (value === undefined || value === "" || TRUTHY.has(value) || FALSY.has(value)) return undefined
  return `${ALLOW_WRITE_ENV}="${env[ALLOW_WRITE_ENV]}" is not recognized; writes are disabled. Use "true" to enable or "false" for read-only.`
}
