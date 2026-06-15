import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

import type { WebClient } from "@slack/web-api"

import { getToken } from "@/client"

// Layered name->id cache for channels and users: an in-memory snapshot per
// client, backed by a token-scoped JSON file on disk so lookups stay warm across
// restarts (mirrors korotovsky's cache). Populated lazily and only when a *name*
// actually needs resolving - ID inputs never touch it.

const TTL_MS = (Number(process.env.SLACK_MCP_CACHE_TTL) || 86_400) * 1000

const cacheDir = () =>
  process.env.SLACK_MCP_CACHE_DIR || join(homedir(), ".cache", "slack-mcp-server")

// token-scoped, hashed so the token never lands in a filename
const cacheFile = (client: WebClient) => {
  const hash = createHash("sha256")
    .update(getToken(client) ?? "")
    .digest("hex")
    .slice(0, 12)
  return join(cacheDir(), `cache-${hash}.json`)
}

type Kind = "channels" | "users"
interface Snapshot {
  at: number
  entries: Record<string, string>
}
type Store = Partial<Record<Kind, Snapshot>>

const memory = new WeakMap<WebClient, Store>()

const load = (client: WebClient): Store => {
  const cached = memory.get(client)
  if (cached) return cached
  let store: Store = {}
  try {
    const file = cacheFile(client)
    if (existsSync(file)) store = JSON.parse(readFileSync(file, "utf8")) as Store
  } catch {
    store = {}
  }
  memory.set(client, store)
  return store
}

const persist = (client: WebClient, store: Store) => {
  try {
    // user-only perms: the file holds workspace directory data (channel/user names)
    mkdirSync(cacheDir(), { recursive: true, mode: 0o700 })
    writeFileSync(cacheFile(client), JSON.stringify(store), { mode: 0o600 })
  } catch {
    // best effort: a read-only or unwritable cache dir must not break tool calls
  }
}

const fetchChannels = async (client: WebClient): Promise<Record<string, string>> => {
  const entries: Record<string, string> = {}
  let cursor: string | undefined
  do {
    const res = await client.conversations.list({
      types: "public_channel,private_channel",
      exclude_archived: true,
      limit: 1000,
      cursor,
    })
    for (const c of res.channels ?? []) if (c.id && c.name) entries[c.name.toLowerCase()] = c.id
    cursor = res.response_metadata?.next_cursor || undefined
  } while (cursor)
  return entries
}

const fetchUsers = async (client: WebClient): Promise<Record<string, string>> => {
  const entries: Record<string, string> = {}
  let cursor: string | undefined
  do {
    const res = await client.users.list({ limit: 1000, cursor })
    for (const u of res.members ?? []) {
      if (!u.id) continue
      if (u.name) entries[u.name.toLowerCase()] = u.id
      const display = u.profile?.display_name
      if (display) entries[display.toLowerCase()] = u.id
    }
    cursor = res.response_metadata?.next_cursor || undefined
  } while (cursor)
  return entries
}

const FETCHERS: Record<Kind, (client: WebClient) => Promise<Record<string, string>>> = {
  channels: fetchChannels,
  users: fetchUsers,
}

// Dedupe concurrent populates: N parallel lookups (e.g. resolving a users array)
// against a cold cache share a single list crawl instead of one each.
const inflight = new WeakMap<WebClient, Partial<Record<Kind, Promise<Record<string, string>>>>>()

const fetchOnce = (client: WebClient, kind: Kind): Promise<Record<string, string>> => {
  let pending = inflight.get(client)
  if (!pending) {
    pending = {}
    inflight.set(client, pending)
  }
  const existing = pending[kind]
  if (existing) return existing
  const p = FETCHERS[kind](client).finally(() => {
    delete pending[kind]
  })
  pending[kind] = p
  return p
}

const ensure = async (client: WebClient, kind: Kind, force: boolean): Promise<Snapshot> => {
  const store = load(client)
  const snap = store[kind]
  if (force || !snap || Date.now() - snap.at >= TTL_MS) {
    store[kind] = { at: Date.now(), entries: await fetchOnce(client, kind) }
    persist(client, store)
  }
  return store[kind]!
}

// name (lowercased) -> id, or undefined. On a miss against a not-just-fetched
// snapshot, refresh once so a newly-created channel/user still resolves.
const lookup = async (client: WebClient, kind: Kind, name: string): Promise<string | undefined> => {
  const snap = await ensure(client, kind, false)
  if (snap.entries[name] !== undefined) return snap.entries[name]
  if (Date.now() - snap.at < 5_000) return undefined
  return (await ensure(client, kind, true)).entries[name]
}

export const getChannelId = (client: WebClient, name: string) => lookup(client, "channels", name)
export const getUserId = (client: WebClient, name: string) => lookup(client, "users", name)
