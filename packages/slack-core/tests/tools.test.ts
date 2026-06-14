import { expect, test } from "bun:test"

import type { WebClient } from "@slack/web-api"

import { createClient, TOKEN_ENV } from "@/client"
import { invoke } from "@/invoke"
import { allTools, readTools, toolByName } from "@/registry"
import { conversationsHistory, conversationsList } from "@/tools/conversations"
import { emojiList } from "@/tools/misc"
import { searchMessages } from "@/tools/search"
import { usersList } from "@/tools/users"

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
      info: rec("conversations.info"),
      members: rec("conversations.members"),
      history: rec("conversations.history"),
      replies: rec("conversations.replies"),
    },
    users: {
      list: rec("users.list"),
      info: rec("users.info"),
      lookupByEmail: rec("users.lookupByEmail"),
      conversations: rec("users.conversations"),
      profile: { get: rec("users.profile.get") },
    },
    search: { messages: rec("search.messages"), files: rec("search.files") },
    emoji: { list: rec("emoji.list") },
    team: { info: rec("team.info") },
  } as unknown as WebClient
  return { client, calls }
}

test("createClient requires a token", () => {
  expect(() => createClient("")).toThrow(TOKEN_ENV)
  expect(createClient("xoxp-test")).toBeDefined()
})

test("conversations_list calls conversations.list and maps the result", async () => {
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
    matches: unknown[]
    total: number
  }
  expect(out.total).toBe(1)
  expect(out.matches).toHaveLength(1)
})

test("users_list and emoji_list call the right methods", async () => {
  const { client, calls } = fakeClient()
  await usersList.handler(client, { limit: 200 })
  await emojiList.handler(client, {})
  expect(calls.map((c) => c.method)).toEqual(["users.list", "emoji.list"])
})

test("registry exposes read-only tools whose names and aliases resolve", () => {
  expect(allTools).toHaveLength(14)
  expect(readTools).toHaveLength(14)
  expect(allTools.every((tool) => tool.tier === "read")).toBe(true)
  expect(toolByName("conversations_list")?.name).toBe("conversations_list")
  expect(toolByName("channels_list")?.name).toBe("conversations_list")
  expect(toolByName("nope")).toBeUndefined()
})

test("invoke parses input and applies declared defaults", async () => {
  const { client, calls } = fakeClient()
  await invoke(conversationsList, client, {})
  expect(calls[0]?.method).toBe("conversations.list")
  expect(calls[0]?.args).toMatchObject({ exclude_archived: true, limit: 200 })
})

test("invoke rejects input that violates the schema", async () => {
  const { client } = fakeClient()
  await expect(invoke(conversationsList, client, { limit: 99999 })).rejects.toThrow()
})
