import { afterEach, beforeEach, expect, test } from "bun:test"

import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { allTools, BOT_TOKEN_ENV, readTools, TOKEN_ENV } from "@packages/slack-core"
import type { WebClient } from "@slack/web-api"

import { ALLOW_WRITE_ENV, allowWriteFromEnv } from "@/env"
import { createServer } from "@/server"

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
    },
  } as unknown as WebClient
  return { client, calls }
}

const connect = async (opts?: Parameters<typeof createServer>[0]) => {
  const server = createServer(opts)
  const client = new Client({ name: "test", version: "0.0.0" })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
  return client
}

test("exposes the full tool set by default", async () => {
  const { client: slack } = fakeClient()
  const client = await connect({ client: slack })

  const { tools } = await client.listTools()
  expect(tools).toHaveLength(allTools.length)
  expect(tools.some((t) => t.name === "chat_post_message")).toBe(true)
})

test("allowWrite: false lists only the read-only tool set", async () => {
  const { client: slack } = fakeClient()
  const client = await connect({ client: slack, allowWrite: false })

  const { tools } = await client.listTools()
  expect(tools.map((t) => t.name).sort()).toEqual(readTools.map((t) => t.name).sort())
  expect(tools.every((t) => t.annotations?.readOnlyHint === true)).toBe(true)
  expect(tools.some((t) => t.name === "chat_post_message")).toBe(false)
})

test("the env flag drives write-tool exposure end to end", async () => {
  const { client: slack } = fakeClient()
  const hasWrite = async (env: NodeJS.ProcessEnv) => {
    const client = await connect({ client: slack, allowWrite: allowWriteFromEnv(env) })
    const { tools } = await client.listTools()
    return tools.some((t) => t.name === "chat_post_message")
  }

  expect(await hasWrite({})).toBe(true)
  expect(await hasWrite({ [ALLOW_WRITE_ENV]: "false" })).toBe(false)
  expect(await hasWrite({ [ALLOW_WRITE_ENV]: "off" })).toBe(false) // unrecognized fails safe
})

test("write tool roundtrip under allowWrite returns the mapped result", async () => {
  const slack = {
    chat: { postMessage: async () => ({ ok: true, ts: "1.2", channel: "C1" }) },
  } as unknown as WebClient
  const client = await connect({ client: slack, allowWrite: true })

  const res = await client.callTool({
    name: "chat_post_message",
    arguments: { channel: "C1", text: "hi" },
  })
  const content = res.content as Array<{ type: string; text: string }>
  expect(JSON.parse(content[0]!.text)).toEqual({ ts: "1.2", channel: "C1" })
})

test("chat_update roundtrip edits the message and returns the mapped result", async () => {
  const calls: unknown[] = []
  const slack = {
    chat: {
      update: async (args: unknown) => {
        calls.push(args)
        return { ok: true, ts: "1.2", channel: "C1", text: "edited" }
      },
    },
  } as unknown as WebClient
  const client = await connect({ client: slack })

  const res = await client.callTool({
    name: "chat_update",
    arguments: { channel: "C1", ts: "1.2", text: "edited" },
  })
  expect(calls).toEqual([{ channel: "C1", ts: "1.2", text: "edited" }])
  const content = res.content as Array<{ type: string; text: string }>
  expect(JSON.parse(content[0]!.text)).toEqual({ ts: "1.2", channel: "C1" })
})

test("with a botClient, posting goes through the bot and reads stay on the user", async () => {
  const userCalls: string[] = []
  const botCalls: Array<{ method: string; args: unknown }> = []
  const user = {
    conversations: {
      history: async () => {
        userCalls.push("conversations.history")
        return { ok: true, messages: [] }
      },
    },
  } as unknown as WebClient
  const bot = {
    chat: {
      postMessage: async (args: unknown) => {
        botCalls.push({ method: "chat.postMessage", args })
        return { ok: true, ts: "1.2", channel: "C1" }
      },
    },
  } as unknown as WebClient
  const client = await connect({ client: user, botClient: bot })

  const res = await client.callTool({
    name: "chat_post_message",
    arguments: { channel: "C1", text: "hi" },
  })
  const content = res.content as Array<{ type: string; text: string }>
  expect(JSON.parse(content[0]!.text)).toEqual({ ts: "1.2", channel: "C1" })
  await client.callTool({ name: "conversations_history", arguments: { channel: "C1" } })

  expect(botCalls).toEqual([{ method: "chat.postMessage", args: { channel: "C1", text: "hi" } }])
  expect(userCalls).toEqual(["conversations.history"])
})

test("allowWrite: false hides chat_update", async () => {
  const { client: slack } = fakeClient()
  const client = await connect({ client: slack, allowWrite: false })

  const { tools } = await client.listTools()
  expect(tools.some((t) => t.name === "chat_update")).toBe(false)
})

test("a handler that throws is surfaced as an isError result", async () => {
  const slack = {
    conversations: {
      list: async () => {
        throw new Error("slack is down")
      },
    },
  } as unknown as WebClient
  const client = await connect({ client: slack })

  const res = await client.callTool({ name: "conversations_list", arguments: {} })
  expect(res.isError).toBe(true)
})

test("call roundtrip invokes the tool and returns the mapped result", async () => {
  const { client: slack, calls } = fakeClient({
    "conversations.list": {
      ok: true,
      channels: [{ id: "C1", name: "general" }],
      response_metadata: { next_cursor: "CUR" },
    },
  })
  const client = await connect({ client: slack })

  const res = await client.callTool({ name: "conversations_list", arguments: {} })
  expect(calls[0]?.method).toBe("conversations.list")
  const content = res.content as Array<{ type: string; text: string }>
  expect(JSON.parse(content[0]!.text)).toEqual({
    channels: [{ id: "C1", name: "general" }],
    next_cursor: "CUR",
  })
})

// createServer reads both tokens from env by default; keep a real bot token in
// the developer's shell from routing these fakes' write calls to Slack.
const saved: Record<string, string | undefined> = {}
beforeEach(() => {
  for (const k of [TOKEN_ENV, BOT_TOKEN_ENV]) saved[k] = process.env[k]
  delete process.env[BOT_TOKEN_ENV]
})
afterEach(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
})

test("creating a server without a token throws", () => {
  delete process.env[TOKEN_ENV]
  expect(() => createServer()).toThrow(TOKEN_ENV)
})
