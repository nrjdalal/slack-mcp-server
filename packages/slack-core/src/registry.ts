import {
  conversationsHistory,
  conversationsInfo,
  conversationsList,
  conversationsMembers,
  conversationsReplies,
  usersConversations,
} from "@/tools/conversations"
import { emojiList, teamInfo } from "@/tools/misc"
import { searchFiles, searchMessages } from "@/tools/search"
import { usersInfo, usersList, usersLookupByEmail, usersProfileGet } from "@/tools/users"
import type { SlackTool } from "@/types"

// ordered to match the Slack Web API method sequence
export const readTools: SlackTool[] = [
  conversationsHistory,
  conversationsInfo,
  conversationsList,
  conversationsMembers,
  conversationsReplies,
  emojiList,
  searchFiles,
  searchMessages,
  teamInfo,
  usersConversations,
  usersInfo,
  usersList,
  usersLookupByEmail,
  usersProfileGet,
]

export const allTools: SlackTool[] = [...readTools]

export const toolByName = (name: string): SlackTool | undefined =>
  allTools.find((tool) => tool.name === name || tool.alias === name)
