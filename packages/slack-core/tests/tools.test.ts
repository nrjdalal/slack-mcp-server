import { expect, test } from "bun:test"

import type { WebClient } from "@slack/web-api"

import { createClient, TOKEN_ENV } from "@/client"
import { invoke } from "@/invoke"
import { allTools, enabledTools, readTools, toolByName, writeTools } from "@/registry"
import { chatPostMessage } from "@/tools/chat"
import { conversationsHistory, conversationsList, conversationsMark } from "@/tools/conversations"
import { searchMessages } from "@/tools/search"
import { usersSearch } from "@/tools/users"

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

test("conversations_mark (write) marks read", async () => {
  const { client, calls } = fakeClient()
  const out = await conversationsMark.handler(client, { channel: "C1", ts: "1.2" })
  expect(calls[0]?.method).toBe("conversations.mark")
  expect(out).toEqual({ ok: true })
})

test("registry: read/write tiers and the enabledTools selector", () => {
  expect(readTools).toHaveLength(10)
  expect(writeTools).toHaveLength(9)
  expect(allTools).toHaveLength(19)
  expect(readTools.every((t) => t.tier === "read")).toBe(true)
  expect(writeTools.every((t) => t.tier === "write")).toBe(true)
  expect(enabledTools(false)).toHaveLength(10)
  expect(enabledTools(true)).toHaveLength(19)
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
