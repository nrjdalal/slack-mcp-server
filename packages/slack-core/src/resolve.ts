import type { WebClient } from "@slack/web-api"

import { getChannelId, getUserId } from "@/cache"

// Slack IDs are upper-case (C/G/D… channels, U/W… users); channel and user names
// are always lower-case, so an all-caps ref is unambiguously an ID and passes
// through untouched. Anything else is treated as a #channel / @handle name and
// resolved via the cache.
const CHANNEL_ID = /^[CGD][A-Z0-9]+$/
const USER_ID = /^[UW][A-Z0-9]+$/

export const resolveChannel = async (client: WebClient, ref: string): Promise<string> => {
  const value = ref.trim()
  if (CHANNEL_ID.test(value)) return value
  const id = await getChannelId(client, value.replace(/^#/, "").toLowerCase())
  if (!id) throw new Error(`channel not found: ${ref}`)
  return id
}

export const resolveUser = async (client: WebClient, ref: string): Promise<string> => {
  const value = ref.trim()
  if (USER_ID.test(value)) return value
  const id = await getUserId(client, value.replace(/^@/, "").toLowerCase())
  if (!id) throw new Error(`user not found: ${ref}`)
  return id
}
