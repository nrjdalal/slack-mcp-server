import { expect, test } from "bun:test"

import type { WebClient } from "@slack/web-api"

import { TOKEN_ENV } from "@/client"
import { conversationsUnreads } from "@/tools/conversations"
import { filesInfo } from "@/tools/files"
import { usergroupsMe } from "@/tools/usergroups"

test("conversations_unreads aggregates per-channel unread counts and drops zeros", async () => {
  const info: Record<string, unknown> = {
    C1: { channel: { unread_count_display: 3 } },
    C2: { channel: { unread_count_display: 0 } },
    C3: { channel: { unread_count: 5 } },
  }
  const client = {
    users: {
      conversations: async () => ({
        channels: [
          { id: "C1", name: "a" },
          { id: "C2", name: "b" },
          { id: "C3", name: "c" },
        ],
      }),
    },
    conversations: {
      info: async ({ channel }: { channel: string }) => info[channel],
    },
  } as unknown as WebClient
  const out = (await conversationsUnreads.handler(client, { max_channels: 50 })) as {
    unreads: Array<{ id: string; name?: string; unread_count: number }>
  }
  expect(out.unreads).toEqual([
    { id: "C1", name: "a", unread_count: 3 },
    { id: "C3", name: "c", unread_count: 5 },
  ])
})

test("usergroups_me keeps only groups the authed user belongs to", async () => {
  const client = {
    auth: { test: async () => ({ user_id: "U1" }) },
    usergroups: {
      list: async () => ({
        usergroups: [
          { id: "S1", users: ["U1", "U2"] },
          { id: "S2", users: ["U2"] },
        ],
      }),
    },
  } as unknown as WebClient
  const out = (await usergroupsMe.handler(client, {})) as { usergroups: Array<{ id: string }> }
  expect(out.usergroups.map((g) => g.id)).toEqual(["S1"])
})

const withFetch = async (impl: () => Promise<Response>, fn: () => Promise<void>) => {
  const prevToken = process.env[TOKEN_ENV]
  const prevFetch = globalThis.fetch
  process.env[TOKEN_ENV] = "xoxp-test"
  globalThis.fetch = impl as unknown as typeof fetch
  try {
    await fn()
  } finally {
    globalThis.fetch = prevFetch
    if (prevToken === undefined) delete process.env[TOKEN_ENV]
    else process.env[TOKEN_ENV] = prevToken
  }
}

const fileClient = (file: unknown) =>
  ({ files: { info: async () => ({ file }) } }) as unknown as WebClient

test("files_info returns text content as utf8 under the size cap", async () => {
  await withFetch(
    async () => new Response("hello"),
    async () => {
      const out = (await filesInfo.handler(
        fileClient({ mimetype: "text/plain", size: 5, url_private: "https://files.slack.com/x" }),
        { file: "F1" },
      )) as { content?: { encoding: string; data: string } }
      expect(out.content).toEqual({ encoding: "utf8", data: "hello" })
    },
  )
})

test("files_info returns binary content as base64", async () => {
  await withFetch(
    async () => new Response(new Uint8Array([1, 2, 3])),
    async () => {
      const out = (await filesInfo.handler(
        fileClient({ mimetype: "image/png", size: 3, url_private: "https://files.slack.com/x" }),
        { file: "F1" },
      )) as { content?: { encoding: string; data: string } }
      expect(out.content).toEqual({ encoding: "base64", data: "AQID" })
    },
  )
})

test("files_info skips content above the size cap", async () => {
  let fetched = false
  await withFetch(
    async () => {
      fetched = true
      return new Response("x")
    },
    async () => {
      const out = (await filesInfo.handler(
        fileClient({
          mimetype: "image/png",
          size: 6 * 1024 * 1024,
          url_private: "https://files.slack.com/x",
        }),
        { file: "F1" },
      )) as { content?: unknown }
      expect(out.content).toBeUndefined()
      expect(fetched).toBe(false)
    },
  )
})
