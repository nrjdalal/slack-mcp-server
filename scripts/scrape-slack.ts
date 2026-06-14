// Refreshes scripts/slack-methods.json by re-fetching each listed method's
// user-token scopes from docs.slack.dev. Manual and network-bound:
//
//   bun scripts/scrape-slack.ts
//
// The method list and its reference order are the committed seed; this only
// refreshes the userScopes values.
import { readFileSync, writeFileSync } from "node:fs"

const PATH = new URL("./slack-methods.json", import.meta.url).pathname
const methods = JSON.parse(readFileSync(PATH, "utf8")) as Array<{
  method: string
  userScopes: string[]
}>

const userScopes = (html: string): string[] => {
  const i = html.indexOf("User token:")
  if (i === -1) return []
  const m = html.slice(i).match(/User token:<div[^>]*>(.*?)<\/div>/s)
  const inner = m ? m[1] : ""
  return [
    ...new Set(
      [...inner.matchAll(/\/reference\/scopes\/[^>]*><code>([^<]+)<\/code>/g)].map((x) => x[1]),
    ),
  ]
}

let idx = 0
const worker = async () => {
  while (idx < methods.length) {
    const entry = methods[idx++]
    try {
      const r = await fetch(`https://docs.slack.dev/reference/methods/${entry.method}`)
      entry.userScopes = r.ok ? userScopes(await r.text()) : []
    } catch {
      entry.userScopes = []
    }
  }
}

await Promise.all(Array.from({ length: 8 }, worker))
writeFileSync(PATH, JSON.stringify(methods, null, 2) + "\n")
console.log(
  `refreshed ${methods.length} methods, ${methods.filter((m) => m.userScopes.length).length} with user scopes`,
)
console.warn(
  "Review the git diff before committing: docs.slack.dev HTML parsing is brittle, and a failed fetch zeroes that method's scopes.",
)
