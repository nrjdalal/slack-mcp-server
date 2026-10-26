import { afterEach, beforeEach, expect, test } from "bun:test"

import { Client, InMemoryTransport } from "@modelcontextprotocol/client"
import { allTools, readTools, TOKEN_ENV, writeTools } from "@packages/slack-core"
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

test("every tool carries a title and hints that match its tier", async () => {
  const { client: slack } = fakeClient()
  const client = await connect({ client: slack })

  const { tools } = await client.listTools()
  const byName = new Map(tools.map((t) => [t.name, t]))
  for (const tool of readTools) {
    const listed = byName.get(tool.name)!
    expect(listed.title).toBe(tool.title)
    expect(listed.annotations).toMatchObject({ readOnlyHint: true, openWorldHint: true })
  }
  for (const tool of writeTools) {
    expect(byName.get(tool.name)!.annotations).toMatchObject({
      title: tool.title,
      readOnlyHint: false,
      destructiveHint: tool.destructive,
      idempotentHint: tool.idempotent,
    })
  }
  expect(byName.get("conversations_leave")!.annotations).toMatchObject({ destructiveHint: true })
  expect(byName.get("reactions_add")!.annotations).toMatchObject({
    destructiveHint: false,
    idempotentHint: true,
  })
})

test("the server describes itself, and says so when it is read-only", async () => {
  const { client: slack } = fakeClient()
  const full = await connect({ client: slack })
  const readOnly = await connect({ client: slack, allowWrite: false })

  expect(full.getInstructions()).toContain("next_cursor")
  expect(full.getInstructions()).not.toContain("read-only")
  expect(readOnly.getInstructions()).toContain("read-only")
})

const unreadsSlack = (channels: number, onInfo: () => Promise<void> = async () => {}) => {
  const infoCalls: string[] = []
  const slack = {
    users: {
      conversations: async () => ({
        ok: true,
        channels: Array.from({ length: channels }, (_, i) => ({ id: `C${i}`, name: `c${i}` })),
      }),
    },
    conversations: {
      info: async ({ channel }: { channel: string }) => {
        infoCalls.push(channel)
        await onInfo()
        return { ok: true, channel: { id: channel, unread_count_display: 1 } }
      },
    },
  } as unknown as WebClient
  return { slack, infoCalls }
}

test("a long scan reports progress to a client that asks for it", async () => {
  const { slack } = unreadsSlack(3)
  const client = await connect({ client: slack })

  const seen: Array<{ progress: number; total?: number }> = []
  const res = await client.callTool(
    { name: "conversations_unreads", arguments: {} },
    { onprogress: (p) => void seen.push({ progress: p.progress, total: p.total }) },
  )
  const content = res.content as Array<{ type: string; text: string }>
  expect(JSON.parse(content[0]!.text).unreads).toHaveLength(3)
  expect(seen).toEqual([
    { progress: 1, total: 3 },
    { progress: 2, total: 3 },
    { progress: 3, total: 3 },
  ])
})

test("cancelling a call stops the scan instead of finishing it", async () => {
  const controller = new AbortController()
  const { slack, infoCalls } = unreadsSlack(20, () => new Promise((r) => setTimeout(r, 20)))
  const client = await connect({ client: slack })

  const call = client.callTool(
    { name: "conversations_unreads", arguments: {} },
    { signal: controller.signal, onprogress: () => controller.abort() },
  )
  await expect(call).rejects.toThrow()
  await new Promise((r) => setTimeout(r, 200))
  expect(infoCalls.length).toBeLessThan(20)
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
