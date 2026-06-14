import { z } from "zod"

import { getToken } from "@/client"
import { defineTool } from "@/types"

const MAX_BYTES = 5 * 1024 * 1024

export const filesInfo = defineTool({
  name: "files_info",
  description:
    "Gets information about a file (and, when under 5MB, its content: text as-is, binary as base64).",
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
    const url = file?.url_private_download ?? file?.url_private
    const token = getToken(client)
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
