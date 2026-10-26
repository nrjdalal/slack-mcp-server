import { mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { basename, join } from "node:path"

import { z } from "zod"

import { getToken } from "@/client"
import { rawInput, shapeFile } from "@/shape"
import { defineTool, IMAGE } from "@/types"

const DEFAULT_MAX_BYTES = 256 * 1024
const MAX_BYTES = 5 * 1024 * 1024

export const filesInfo = defineTool({
  name: "files_info",
  title: "Get file info",
  description:
    "Gets information about a file, and its content when it fits under max_bytes (text as-is, binary as base64). Otherwise content_omitted says why.",
  tier: "read",
  scopes: ["files:read"],
  input: z.object({
    file: z.string().describe("Specify a file by providing its ID."),
    count: z.number().int().optional().describe("Number of comments to return per page."),
    cursor: z
      .string()
      .optional()
      .describe(
        "Parameter for pagination. Set to the next_cursor attribute returned by the previous request's response_metadata.",
      ),
    limit: z.number().int().optional().describe("The maximum number of items to return."),
    page: z.number().int().optional().describe("Page number of comments to return."),
    max_bytes: z
      .number()
      .int()
      .min(0)
      .max(MAX_BYTES)
      .default(DEFAULT_MAX_BYTES)
      .describe(
        "Largest file, in bytes, whose content is returned inline. Base64 is a third larger than the file, so keep this small for binaries. 0 returns metadata only.",
      ),
    raw: rawInput,
  }),
  handler: async (client, args) => {
    const res = await client.files.info({
      file: args.file,
      count: args.count,
      cursor: args.cursor,
      limit: args.limit,
      page: args.page,
    })
    const file = res.file as
      | {
          url_private_download?: string
          url_private?: string
          mimetype?: string
          size?: number
        }
      | undefined
    const shown = args.raw ? res.file : shapeFile(res.file)
    if (!file) return { file: shown }
    const url = file.url_private_download ?? file.url_private
    const token = getToken(client)
    const size = file.size ?? 0
    if (!url || !token) return { file: shown, content_omitted: "no downloadable URL" }
    if (size > args.max_bytes) {
      return {
        file: shown,
        content_omitted: `file is ${size} bytes, over max_bytes (${args.max_bytes})`,
      }
    }
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!r.ok) return { file: shown, content_omitted: `download failed with HTTP ${r.status}` }
    const buf = Buffer.from(await r.arrayBuffer())
    const content = (file.mimetype ?? "").startsWith("text/")
      ? { encoding: "utf8" as const, data: buf.toString("utf8") }
      : { encoding: "base64" as const, data: buf.toString("base64") }
    return { file: shown, content }
  },
})

const IMAGE_TYPES = new Set(["image/gif", "image/jpeg", "image/png", "image/webp"])

export const filesDownload = defineTool({
  name: "files_download",
  title: "Download file",
  description:
    "Downloads a file. Text under max_bytes comes back inline and images under max_bytes as image content; anything else is saved to a local temp file whose path is returned.",
  tier: "read",
  scopes: ["files:read"],
  input: z.object({
    file: z.string().describe("Specify a file by providing its ID."),
    max_bytes: z
      .number()
      .int()
      .min(0)
      .max(MAX_BYTES)
      .default(DEFAULT_MAX_BYTES)
      .describe(
        "Largest text or image, in bytes, returned inline. Larger files are saved to a temp path instead.",
      ),
  }),
  handler: async (client, args) => {
    const res = await client.files.info({ file: args.file })
    const file = res.file as
      | {
          id?: string
          name?: string
          mimetype?: string
          url_private_download?: string
          url_private?: string
        }
      | undefined
    const url = file?.url_private_download ?? file?.url_private
    const token = getToken(client)
    if (!file || !url || !token) throw new Error(`file ${args.file} has no downloadable URL`)
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!r.ok) throw new Error(`download failed with HTTP ${r.status}`)
    const mimetype = file.mimetype ?? ""
    if ((r.headers.get("content-type") ?? "").startsWith("text/html") && mimetype !== "text/html") {
      throw new Error(
        "download returned a Slack sign-in page, not the file; check the token has files:read",
      )
    }
    const buf = Buffer.from(await r.arrayBuffer())
    const meta = { file: { id: file.id, name: file.name, mimetype, size: buf.length } }
    if (buf.length <= args.max_bytes) {
      if (mimetype.startsWith("text/")) return { ...meta, text: buf.toString("utf8") }
      if (IMAGE_TYPES.has(mimetype)) {
        return { ...meta, [IMAGE]: { data: buf.toString("base64"), mimeType: mimetype } }
      }
    }
    const path = join(await mkdtemp(join(tmpdir(), "slack-mcp-")), basename(file.name ?? args.file))
    await writeFile(path, buf)
    return { ...meta, path }
  },
})

export const filesUploadV2 = defineTool({
  name: "files_upload_v2",
  title: "Upload file",
  description:
    "Uploads a file to a channel, DM or thread, from a local path or from text content. Needs the files:write user scope.",
  tier: "write",
  destructive: false,
  idempotent: false,
  scopes: ["files:write"],
  input: z
    .object({
      channel: z
        .string()
        .describe(
          "Channel to share the file in. For direct messages, use the DM ID (starts with D), not a user ID.",
        ),
      path: z
        .string()
        .optional()
        .describe("Local path of the file to upload. Use this or content."),
      content: z.string().optional().describe("Text to upload as a file. Use this or path."),
      filename: z
        .string()
        .optional()
        .describe(
          "Name of the file. Defaults to the path's file name, or snippet.txt for content.",
        ),
      title: z.string().optional().describe("File title."),
      initial_comment: z
        .string()
        .optional()
        .describe("The message text introducing the file in the channel."),
      thread_ts: z
        .string()
        .optional()
        .describe("Provide another message's ts value to upload this file as a reply."),
    })
    .refine((a) => (a.path === undefined) !== (a.content === undefined), {
      message: "Pass exactly one of path or content.",
    }),
  handler: async (client, args) => {
    const source =
      args.path !== undefined
        ? { file: args.path, filename: args.filename ?? basename(args.path) }
        : { content: args.content ?? "", filename: args.filename ?? "snippet.txt" }
    try {
      const res = await client.filesUploadV2({
        channel_id: args.channel,
        ...source,
        title: args.title,
        initial_comment: args.initial_comment,
        thread_ts: args.thread_ts,
      } as Parameters<typeof client.filesUploadV2>[0])
      const files = res.files.flatMap((r) => r.files ?? [])
      return { files: files.map((f) => ({ id: f.id, name: f.name, permalink: f.permalink })) }
    } catch (error) {
      if ((error as { data?: { error?: string } }).data?.error === "missing_scope") {
        throw new Error(
          "missing_scope: add files:write under User Token Scopes on the Slack app's OAuth & Permissions page, reinstall the app, and use the new user token",
        )
      }
      throw error
    }
  },
})
