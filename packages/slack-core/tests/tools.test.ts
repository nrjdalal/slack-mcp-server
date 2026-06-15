import { expect, test } from "bun:test"

import type { WebClient } from "@slack/web-api"

import { createClient, TOKEN_ENV } from "@/client"
import { invoke } from "@/invoke"
import { allTools, enabledTools, readTools, toolByName, writeTools } from "@/registry"
import { chatPostMessage, chatScheduleMessage, chatUpdate } from "@/tools/chat"
import {
  conversationsHistory,
  conversationsList,
  conversationsMark,
  conversationsMembers,
  conversationsOpen,
  conversationsUnreads,
} from "@/tools/conversations"
import { searchFiles, searchMessages } from "@/tools/search"
import { usersInfo, usersLookupByEmail, usersSearch } from "@/tools/users"

type Call = { method: string; args: unknown }

const fakeClient = (responses: Record<string, unknown> = {}) => {
  const calls: Call[] = []
  const rec = (method: string) => async (args?: unknown) => {
    calls.push({ method, args })
    return (responses[method] as object) ?? { ok: true }
  }
  const client = {
    conversations: {
      list: rec("conversations.list"),
      history: rec("conversations.history"),
      mark: rec("conversations.mark"),
    },
    users: { list: rec("users.list") },
    search: { messages: rec("search.messages") },
    chat: { postMessage: rec("chat.postMessage") },
  } as unknown as WebClient
  return { client, calls }
}

test("createClient requires a token", () => {
  expect(() => createClient("")).toThrow(TOKEN_ENV)
  expect(createClient("xoxp-test")).toBeDefined()
})

test("conversations_list maps channels and cursor", async () => {
  const { client, calls } = fakeClient({
    "conversations.list": {
      ok: true,
      channels: [{ id: "C1", name: "general" }],
      response_metadata: { next_cursor: "CUR" },
    },
  })
  const out = await conversationsList.handler(client, { exclude_archived: true, limit: 200 })
  expect(calls[0]?.method).toBe("conversations.list")
  expect(out).toEqual({ channels: [{ id: "C1", name: "general" }], next_cursor: "CUR" })
})

test("conversations_list fetch_all follows the cursor across pages", async () => {
  let call = 0
  const pages = [
    { ok: true, channels: [{ id: "C1" }], response_metadata: { next_cursor: "CUR" } },
    { ok: true, channels: [{ id: "C2" }], response_metadata: { next_cursor: "" } },
  ]
  const client = {
    conversations: { list: async () => pages[call++] },
  } as unknown as WebClient
  const out = (await conversationsList.handler(client, {
    fetch_all: true,
    exclude_archived: true,
    limit: 200,
  })) as { channels: Array<{ id: string }>; next_cursor?: string }
  expect(out.channels.map((c) => c.id)).toEqual(["C1", "C2"])
  expect(out.next_cursor).toBeUndefined()
  expect(call).toBe(2)
})

test("conversations_list fetch_all stops at the page cap and returns a resume cursor", async () => {
  let call = 0
  const client = {
    conversations: {
      list: async () => {
        call++
        return {
          ok: true,
          channels: [{ id: `C${call}` }],
          response_metadata: { next_cursor: "MORE" },
        }
      },
    },
  } as unknown as WebClient
  const out = (await conversationsList.handler(client, {
    fetch_all: true,
    exclude_archived: true,
    limit: 200,
  })) as { channels: Array<{ id: string }>; next_cursor?: string }
  expect(out.next_cursor).toBe("MORE") // truncated, resumable rather than silently cut
  expect(call).toBeLessThanOrEqual(50) // bounded by MAX_PAGES, never unbounded
  expect(out.channels.length).toBe(call)
})

test("conversations_history maps messages and has_more", async () => {
  const { client } = fakeClient({
    "conversations.history": { ok: true, messages: [{ text: "hi" }], has_more: true },
  })
  const out = await conversationsHistory.handler(client, { channel: "C1", limit: 50 })
  expect(out).toEqual({ messages: [{ text: "hi" }], has_more: true, next_cursor: undefined })
})

test("search_messages unwraps matches and total", async () => {
  const { client } = fakeClient({
    "search.messages": { ok: true, messages: { matches: [{ text: "x" }], total: 1 } },
  })
  const out = (await searchMessages.handler(client, { query: "x", count: 20, page: 1 })) as {
    total: number
  }
  expect(out.total).toBe(1)
})

test("users_search filters users.list by query", async () => {
  const { client } = fakeClient({
    "users.list": {
      ok: true,
      members: [
        { id: "U1", name: "alice", profile: { email: "alice@x.dev" } },
        { id: "U2", name: "bob" },
      ],
    },
  })
  const out = (await usersSearch.handler(client, { query: "ALICE", limit: 200 })) as {
    matches: Array<{ id: string }>
  }
  expect(out.matches.map((m) => m.id)).toEqual(["U1"])
})

test("chat_post_message (write) posts and returns ts", async () => {
  const { client, calls } = fakeClient({
    "chat.postMessage": { ok: true, ts: "123.45", channel: "C1" },
  })
  const out = await chatPostMessage.handler(client, { channel: "C1", text: "hi" })
  expect(calls[0]?.method).toBe("chat.postMessage")
  expect(out).toEqual({ ts: "123.45", channel: "C1" })
})

test("conversations_unreads keeps only channels with unreads, in order", async () => {
  const counts: Record<string, number> = { C1: 3, C2: 0, C3: 7 }
  const client = {
    users: {
      conversations: async () => ({
        ok: true,
        channels: [
          { id: "C1", name: "one" },
          { id: "C2", name: "two" },
          { id: "C3", name: "three" },
        ],
      }),
    },
    conversations: {
      info: async ({ channel }: { channel: string }) => ({
        ok: true,
        channel: { unread_count_display: counts[channel] ?? 0 },
      }),
    },
  } as unknown as WebClient
  const out = (await conversationsUnreads.handler(client, { max_channels: 50 })) as {
    unreads: Array<{ id: string; name?: string; unread_count: number }>
  }
  expect(out.unreads).toEqual([
    { id: "C1", name: "one", unread_count: 3 },
    { id: "C3", name: "three", unread_count: 7 },
  ])
})

test("conversations_unreads skips a channel whose info call fails", async () => {
  const client = {
    users: {
      conversations: async () => ({
        ok: true,
        channels: [
          { id: "C1", name: "one" },
          { id: "C2", name: "two" },
          { id: "C3", name: "three" },
        ],
      }),
    },
    conversations: {
      info: async ({ channel }: { channel: string }) => {
        if (channel === "C2") throw new Error("channel_not_found")
        return { ok: true, channel: { unread_count_display: 5 } }
      },
    },
  } as unknown as WebClient
  const out = (await conversationsUnreads.handler(client, { max_channels: 50 })) as {
    unreads: Array<{ id: string }>
  }
  expect(out.unreads.map((u) => u.id)).toEqual(["C1", "C3"])
})

test("chat_update (write) returns the updated ts/channel/text", async () => {
  const client = {
    chat: { update: async () => ({ ok: true, ts: "1.2", channel: "C1", text: "edited" }) },
  } as unknown as WebClient
  const out = await chatUpdate.handler(client, { channel: "C1", ts: "1.2", text: "edited" })
  expect(out).toEqual({ ts: "1.2", channel: "C1", text: "edited" })
})

test("chat_schedule_message (write) returns the scheduled id", async () => {
  const client = {
    chat: {
      scheduleMessage: async () => ({
        ok: true,
        scheduled_message_id: "Q1",
        channel: "C1",
        post_at: 123,
      }),
    },
  } as unknown as WebClient
  const out = await chatScheduleMessage.handler(client, { channel: "C1", post_at: 123, text: "hi" })
  expect(out).toEqual({ scheduled_message_id: "Q1", channel: "C1", post_at: 123 })
})

test("conversations_members maps members and cursor", async () => {
  const client = {
    conversations: {
      members: async () => ({
        ok: true,
        members: ["U1", "U2"],
        response_metadata: { next_cursor: "CUR" },
      }),
    },
  } as unknown as WebClient
  const out = (await conversationsMembers.handler(client, { channel: "C1", limit: 100 })) as {
    members: string[]
    next_cursor?: string
  }
  expect(out).toEqual({ members: ["U1", "U2"], next_cursor: "CUR" })
})

test("conversations_open joins users into a csv and returns the channel", async () => {
  let received: unknown
  const client = {
    conversations: {
      open: async (args: unknown) => {
        received = args
        return { ok: true, channel: { id: "D1" }, no_op: false, already_open: false }
      },
    },
  } as unknown as WebClient
  const out = (await conversationsOpen.handler(client, { users: ["U1", "U2"] })) as {
    channel: { id: string }
  }
  expect((received as { users?: string }).users).toBe("U1,U2")
  expect(out.channel).toEqual({ id: "D1" })
})

test("users_info returns the user", async () => {
  const client = {
    users: { info: async () => ({ ok: true, user: { id: "U1", name: "alice" } }) },
  } as unknown as WebClient
  const out = (await usersInfo.handler(client, { user: "U1" })) as {
    user: { id: string; name: string }
  }
  expect(out.user).toEqual({ id: "U1", name: "alice" })
})

test("users_lookup_by_email returns the user", async () => {
  const client = {
    users: { lookupByEmail: async () => ({ ok: true, user: { id: "U9", name: "bob" } }) },
  } as unknown as WebClient
  const out = (await usersLookupByEmail.handler(client, { email: "bob@x.dev" })) as {
    user: { id: string; name: string }
  }
  expect(out.user).toEqual({ id: "U9", name: "bob" })
})

test("search_files unwraps file matches and total", async () => {
  const client = {
    search: {
      files: async () => ({ ok: true, files: { matches: [{ id: "F1" }], total: 1 } }),
    },
  } as unknown as WebClient
  const out = (await searchFiles.handler(client, { query: "x", count: 20 })) as { total: number }
  expect(out.total).toBe(1)
})

test("conversations_mark (write) marks read", async () => {
  const { client, calls } = fakeClient()
  const out = await conversationsMark.handler(client, { channel: "C1", ts: "1.2" })
  expect(calls[0]?.method).toBe("conversations.mark")
  expect(out).toEqual({ ok: true })
})

test("registry: read/write tiers and the enabledTools selector", () => {
  expect(readTools).toHaveLength(14)
  expect(writeTools).toHaveLength(13)
  expect(allTools).toHaveLength(27)
  expect(readTools.every((t) => t.tier === "read")).toBe(true)
  expect(writeTools.every((t) => t.tier === "write")).toBe(true)
  expect(enabledTools(false)).toHaveLength(14)
  expect(enabledTools(true)).toHaveLength(27)
})

test("toolByName resolves tool names", () => {
  expect(toolByName("conversations_list")?.name).toBe("conversations_list")
  expect(toolByName("chat_post_message")?.name).toBe("chat_post_message")
  expect(toolByName("nope")).toBeUndefined()
})

test("invoke applies declared defaults and rejects invalid input", async () => {
  const { client, calls } = fakeClient()
  await invoke(conversationsList, client, {})
  expect(calls[0]?.args).toMatchObject({ exclude_archived: true, limit: 200 })
  await expect(invoke(conversationsList, client, { limit: 99999 })).rejects.toThrow()
})
