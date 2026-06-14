import { afterEach, beforeEach, expect, test } from "bun:test"

import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { allTools, readTools, TOKEN_ENV } from "@packages/slack-core"
import type { WebClient } from "@slack/web-api"

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

test("lists the read-only tool set by default", async () => {
  const { client: slack } = fakeClient()
  const client = await connect({ client: slack })

  const { tools } = await client.listTools()
  expect(tools.map((t) => t.name).sort()).toEqual(readTools.map((t) => t.name).sort())
  expect(tools.every((t) => t.annotations?.readOnlyHint === true)).toBe(true)
  expect(tools.some((t) => t.name === "chat_post_message")).toBe(false)
})

test("allowWrite exposes the full tool set", async () => {
  const { client: slack } = fakeClient()
  const client = await connect({ client: slack, allowWrite: true })

  const { tools } = await client.listTools()
  expect(tools).toHaveLength(allTools.length)
  expect(tools.some((t) => t.name === "chat_post_message")).toBe(true)
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

let savedToken: string | undefined
beforeEach(() => {
  savedToken = process.env[TOKEN_ENV]
})
afterEach(() => {
  if (savedToken === undefined) delete process.env[TOKEN_ENV]
  else process.env[TOKEN_ENV] = savedToken
})

test("creating a server without a token throws", () => {
  delete process.env[TOKEN_ENV]
  expect(() => createServer()).toThrow(TOKEN_ENV)
})
