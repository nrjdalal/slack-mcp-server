import { z } from "zod"

import { defineTool } from "@/types"

const MAX_BYTES = 5 * 1024 * 1024

export const filesInfo = defineTool({
  name: "files_info",
  description:
    "Get a file's metadata and, when under 5MB, its content (text as-is, binary as base64).",
  tier: "read",
  scopes: ["files:read"],
  input: z.object({ file: z.string().describe("File ID (Fxxxx).") }),
  handler: async (client, args) => {
    const res = await client.files.info({ file: args.file })
    const file = res.file as
      | {
          url_private_download?: string
          url_private?: string
          mimetype?: string
          size?: number
        }
      | undefined
    const url = file?.url_private_download ?? file?.url_private
    const token = (client as { token?: string }).token
    let content: { encoding: "utf8" | "base64"; data: string } | undefined
    if (url && token && (file?.size ?? 0) <= MAX_BYTES) {
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      const buf = Buffer.from(await r.arrayBuffer())
      content = (file?.mimetype ?? "").startsWith("text/")
        ? { encoding: "utf8", data: buf.toString("utf8") }
        : { encoding: "base64", data: buf.toString("base64") }
    }
    return { file: res.file, content }
  },
})
