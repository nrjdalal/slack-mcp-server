import {
  channelHistory,
  channelInfo,
  channelMembers,
  listChannels,
  myChannels,
  threadReplies,
} from "@/tools/conversations"
import { listEmoji, teamInfo } from "@/tools/misc"
import { searchFiles, searchMessages } from "@/tools/search"
import { findUserByEmail, listUsers, userInfo, userProfile } from "@/tools/users"
import type { SlackTool } from "@/types"

export const readTools: SlackTool[] = [
  listChannels,
  myChannels,
  channelInfo,
  channelMembers,
  channelHistory,
  threadReplies,
  listUsers,
  userInfo,
  userProfile,
  findUserByEmail,
  searchMessages,
  searchFiles,
  listEmoji,
  teamInfo,
]

export const allTools: SlackTool[] = [...readTools]

export const toolByName = (name: string): SlackTool | undefined =>
  allTools.find((tool) => tool.name === name || tool.alias === name)
