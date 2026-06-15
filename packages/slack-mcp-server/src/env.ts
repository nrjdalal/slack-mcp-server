export const ALLOW_WRITE_ENV = "SLACK_MCP_ALLOW_WRITE"

const TRUTHY = new Set(["true", "1"])
const FALSY = new Set(["false", "0"])

const normalize = (env: NodeJS.ProcessEnv) => env[ALLOW_WRITE_ENV]?.trim().toLowerCase()

// Write-gating policy lives in the server layer: writes are ENABLED by default.
// Set SLACK_MCP_ALLOW_WRITE to a falsy value ("false" or "0", case-insensitive)
// to run read-only; an unset or empty value keeps writes on.
export const allowWriteFromEnv = (env: NodeJS.ProcessEnv = process.env): boolean =>
  !FALSY.has(normalize(env) ?? "")

// A set-but-unrecognized value (e.g. "no", "off") falls back to the default (on);
// return a warning so an operator who expected read-only is not left guessing.
// Pure: the caller decides where to surface it.
export const allowWriteWarning = (env: NodeJS.ProcessEnv = process.env): string | undefined => {
  const value = normalize(env)
  if (value === undefined || value === "" || TRUTHY.has(value) || FALSY.has(value)) return undefined
  return `${ALLOW_WRITE_ENV}="${env[ALLOW_WRITE_ENV]}" is not recognized; writes stay enabled (use "false" to disable).`
}
