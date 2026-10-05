import { afterEach, beforeEach, expect, test } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import type { WebClient } from "@slack/web-api"
import type { z } from "zod"

import { BOT_TOKEN_ENV, createBotClient } from "@/client"
import { invoke } from "@/invoke"
import { allTools } from "@/registry"
import { chatDelete, chatPostMessage, chatUpdate } from "@/tools/chat"
import { conversationsHistory } from "@/tools/conversations"
import { reactionsAdd, reactionsRemove } from "@/tools/reactions"

type Call = { method: string; args: unknown }

// one recorder per token, so each test can assert which identity Slack saw
const fakeClient = () => {
  const calls: Call[] = []
  const rec = (method: string) => async (args?: unknown) => {
    calls.push({ method, args })
    return { ok: true, ts: "1.2", channel: "C1", messages: [] }
  }
  const client = {
    chat: {
      postMessage: rec("chat.postMessage"),
      update: rec("chat.update"),
      delete: rec("chat.delete"),
    },
    reactions: { add: rec("reactions.add"), remove: rec("reactions.remove") },
    conversations: {
      history: rec("conversations.history"),
      list: async () => {
        calls.push({ method: "conversations.list", args: undefined })
        return { ok: true, channels: [{ id: "C9", name: "lightman" }], response_metadata: {} }
      },
    },
  } as unknown as WebClient
  return { client, calls }
}

let dir: string
const saved: Record<string, string | undefined> = {}
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "slack-bot-"))
  for (const k of ["SLACK_MCP_CACHE_DIR", "SLACK_MCP_XOXP_TOKEN", BOT_TOKEN_ENV])
    saved[k] = process.env[k]
  process.env.SLACK_MCP_CACHE_DIR = dir
  process.env.SLACK_MCP_XOXP_TOKEN = "xoxp-bot-test"
  delete process.env[BOT_TOKEN_ENV]
})
afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
})

test("createBotClient is opt-in: undefined without a token", () => {
  expect(createBotClient()).toBeUndefined()
  expect(createBotClient("")).toBeUndefined()
  expect(createBotClient("xoxb-test")).toBeDefined()
  process.env[BOT_TOKEN_ENV] = "xoxb-from-env"
  expect(createBotClient()).toBeDefined()
})

test("bot-capable tools are exactly post, update, delete and the reactions", () => {
  const names = allTools.filter((t) => t.botCapable).map((t) => t.name)
  expect(names.sort()).toEqual(
    ["chat_delete", "chat_post_message", "chat_update", "reactions_add", "reactions_remove"].sort(),
  )
  expect(allTools.filter((t) => t.botCapable).every((t) => t.tier === "write")).toBe(true)
})

// zod strips undeclared keys, so a bot-capable tool missing as_user would silently
// ignore as_user: true and act as the bot.
test("every bot-capable tool declares as_user", () => {
  for (const tool of allTools.filter((t) => t.botCapable)) {
    expect((tool.input as z.ZodObject<z.ZodRawShape>).shape.as_user).toBeDefined()
  }
})

test("without a bot client, bot-capable tools act as the user", async () => {
  const user = fakeClient()
  await invoke(chatPostMessage, user.client, { channel: "C1", text: "hi" })
  expect(user.calls).toEqual([{ method: "chat.postMessage", args: { channel: "C1", text: "hi" } }])
})

test("without a bot client, as_user is still never sent to Slack", async () => {
  const user = fakeClient()
  await invoke(chatUpdate, user.client, { channel: "C1", ts: "1.2", text: "x", as_user: true })
  await invoke(chatPostMessage, user.client, { channel: "C1", text: "y", as_user: false })
  expect(user.calls).toEqual([
    { method: "chat.update", args: { channel: "C1", ts: "1.2", text: "x" } },
    { method: "chat.postMessage", args: { channel: "C1", text: "y" } },
  ])
})

test("a bot can DM a user by ID, with no channel lookup", async () => {
  const user = fakeClient()
  const bot = fakeClient()
  await invoke(
    chatPostMessage,
    user.client,
    { channel: "U0ABCDE123", text: "ping" },
    { botClient: bot.client },
  )
  expect(bot.calls).toEqual([
    { method: "chat.postMessage", args: { channel: "U0ABCDE123", text: "ping" } },
  ])
  expect(user.calls).toHaveLength(0)
})

test("with a bot client, post, update, delete and reactions act as the bot", async () => {
  const user = fakeClient()
  const bot = fakeClient()
  const opts = { botClient: bot.client }
  await invoke(chatPostMessage, user.client, { channel: "C1", text: "hi" }, opts)
  await invoke(chatUpdate, user.client, { channel: "C1", ts: "1.2", text: "fix" }, opts)
  await invoke(chatDelete, user.client, { channel: "C1", ts: "1.2" }, opts)
  await invoke(reactionsAdd, user.client, { channel: "C1", name: "eyes", timestamp: "1.2" }, opts)
  await invoke(
    reactionsRemove,
    user.client,
    { channel: "C1", name: "eyes", timestamp: "1.2" },
    opts,
  )
  expect(bot.calls.map((c) => c.method)).toEqual([
    "chat.postMessage",
    "chat.update",
    "chat.delete",
    "reactions.add",
    "reactions.remove",
  ])
  expect(user.calls).toHaveLength(0)
})

test("reads stay on the user token even with a bot client", async () => {
  const user = fakeClient()
  const bot = fakeClient()
  await invoke(conversationsHistory, user.client, { channel: "C1" }, { botClient: bot.client })
  expect(user.calls.map((c) => c.method)).toEqual(["conversations.history"])
  expect(bot.calls).toHaveLength(0)
})

test("as_user: true routes back to the user and is not sent to Slack", async () => {
  const user = fakeClient()
  const bot = fakeClient()
  await invoke(
    chatUpdate,
    user.client,
    { channel: "C1", ts: "1.2", text: "old post", as_user: true },
    { botClient: bot.client },
  )
  expect(user.calls).toEqual([
    { method: "chat.update", args: { channel: "C1", ts: "1.2", text: "old post" } },
  ])
  expect(bot.calls).toHaveLength(0)
})

test("as_user is stripped on the bot path too, and false keeps the bot", async () => {
  const user = fakeClient()
  const bot = fakeClient()
  await invoke(
    chatPostMessage,
    user.client,
    { channel: "C1", text: "hi", as_user: false },
    { botClient: bot.client },
  )
  expect(bot.calls).toEqual([{ method: "chat.postMessage", args: { channel: "C1", text: "hi" } }])
})

test("a #channel name resolves on the user token, then posts as the bot", async () => {
  const user = fakeClient()
  const bot = fakeClient()
  await invoke(
    chatPostMessage,
    user.client,
    { channel: "#lightman", text: "hi" },
    { botClient: bot.client },
  )
  expect(user.calls.map((c) => c.method)).toEqual(["conversations.list"])
  expect(bot.calls).toEqual([{ method: "chat.postMessage", args: { channel: "C9", text: "hi" } }])
})
