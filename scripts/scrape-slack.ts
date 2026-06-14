// Refreshes scripts/slack-methods.json by re-fetching each listed method's
// user-token scopes and rate-limit tier from docs.slack.dev. Manual and
// network-bound:
//
//   bun scripts/scrape-slack.ts
//
// The method list and its reference order are the committed seed; this only
// refreshes the userScopes / tier values, and preserves existing values on a
// failed fetch so a transient error never zeroes committed data.
import { readFileSync, writeFileSync } from "node:fs"

const PATH = new URL("./slack-methods.json", import.meta.url).pathname
const methods = JSON.parse(readFileSync(PATH, "utf8")) as Array<{
  method: string
  userScopes: string[]
  tier?: string
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

// "Tier 3: 50+ per minute" -> "Tier 3"; "Special rate limits apply." -> "Special".
const tier = (html: string): string => {
  const m = html.match(/Rate Limits<\/strong><a[^>]*rate-limits[^>]*>([^<]+)<\/a>/)
  if (!m) return ""
  const t = m[1].match(/Tier\s*(\d)/)
  if (t) return `Tier ${t[1]}`
  if (/special/i.test(m[1])) return "Special"
  return ""
}

let idx = 0
const worker = async () => {
  while (idx < methods.length) {
    const entry = methods[idx++]
    try {
      const r = await fetch(`https://docs.slack.dev/reference/methods/${entry.method}`)
      if (!r.ok) continue // preserve existing values
      const html = await r.text()
      entry.userScopes = userScopes(html)
      entry.tier = tier(html)
    } catch {
      // preserve existing values on a transient failure
    }
  }
}

await Promise.all(Array.from({ length: 8 }, worker))
writeFileSync(PATH, JSON.stringify(methods, null, 2) + "\n")
console.log(
  `refreshed ${methods.length} methods, ${methods.filter((m) => m.userScopes.length).length} with scopes, ${methods.filter((m) => m.tier).length} with a tier`,
)
console.warn("Review the git diff before committing: docs.slack.dev HTML parsing is brittle.")
