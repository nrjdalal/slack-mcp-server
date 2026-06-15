import { afterEach, beforeEach, expect, test } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import type { WebClient } from "@slack/web-api"

import { invoke } from "@/invoke"
import { resolveChannel, resolveUser } from "@/resolve"
import { conversationsHistory } from "@/tools/conversations"

type Member = { id: string; name?: string; profile?: { display_name?: string } }
type Channel = { id: string; name?: string }

const fakeClient = (channels: Channel[] = [], members: Member[] = []) => {
  const calls = { channels: 0, users: 0 }
  const client = {
    conversations: {
      list: async () => {
        calls.channels++
        return { ok: true, channels, response_metadata: {} }
      },
    },
    users: {
      list: async () => {
        calls.users++
        return { ok: true, members, response_metadata: {} }
      },
    },
  } as unknown as WebClient
  return { client, calls }
}

let dir: string
const saved: Record<string, string | undefined> = {}
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "slack-cache-"))
  saved.SLACK_MCP_CACHE_DIR = process.env.SLACK_MCP_CACHE_DIR
  saved.SLACK_MCP_XOXP_TOKEN = process.env.SLACK_MCP_XOXP_TOKEN
  process.env.SLACK_MCP_CACHE_DIR = dir
  process.env.SLACK_MCP_XOXP_TOKEN = "xoxp-resolve-test"
})
afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
})

test("an ID ref passes through without touching the cache", async () => {
  const { client, calls } = fakeClient()
  expect(await resolveChannel(client, "C0ABCDE123")).toBe("C0ABCDE123")
  expect(await resolveUser(client, "U0ABCDE123")).toBe("U0ABCDE123")
  expect(calls).toEqual({ channels: 0, users: 0 })
})

test("a #channel name resolves via the cache and stays cached", async () => {
  const { client, calls } = fakeClient([{ id: "C1", name: "general" }])
  expect(await resolveChannel(client, "#general")).toBe("C1")
  expect(await resolveChannel(client, "general")).toBe("C1")
  expect(calls.channels).toBe(1)
})

test("an unknown name throws a clear not-found error", async () => {
  const { client } = fakeClient([{ id: "C1", name: "general" }])
  await expect(resolveChannel(client, "#nope")).rejects.toThrow("channel not found: #nope")
})

test("a @handle resolves by username or display name", async () => {
  const members = [{ id: "U1", name: "alice", profile: { display_name: "Alice A" } }]
  const { client, calls } = fakeClient([], members)
  expect(await resolveUser(client, "@alice")).toBe("U1")
  expect(await resolveUser(client, "Alice A")).toBe("U1")
  expect(calls.users).toBe(1)
})

test("the cache persists to disk: a fresh client reads it without refetching", async () => {
  const channels = [{ id: "C1", name: "general" }]
  const a = fakeClient(channels)
  expect(await resolveChannel(a.client, "#general")).toBe("C1")
  expect(a.calls.channels).toBe(1)

  const b = fakeClient(channels) // new instance, cold in-memory
  expect(await resolveChannel(b.client, "#general")).toBe("C1")
  expect(b.calls.channels).toBe(0) // loaded from the on-disk cache
})

test("invoke resolves a #channel arg before the handler runs", async () => {
  const recorded: Array<{ channel?: string }> = []
  const client = {
    conversations: {
      list: async () => ({
        ok: true,
        channels: [{ id: "C1", name: "general" }],
        response_metadata: {},
      }),
      history: async (args: { channel?: string }) => {
        recorded.push(args)
        return { ok: true, messages: [] }
      },
    },
  } as unknown as WebClient
  await invoke(conversationsHistory, client, { channel: "#general", limit: 1 })
  expect(recorded[0]?.channel).toBe("C1")
})
