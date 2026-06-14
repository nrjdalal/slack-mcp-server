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

export const readTools: SlackTool[] = [
  conversationsList,
  usersConversations,
  conversationsInfo,
  conversationsMembers,
  conversationsHistory,
  conversationsReplies,
  usersList,
  usersInfo,
  usersProfileGet,
  usersLookupByEmail,
  searchMessages,
  searchFiles,
  emojiList,
  teamInfo,
]

export const allTools: SlackTool[] = [...readTools]

export const toolByName = (name: string): SlackTool | undefined =>
  allTools.find((tool) => tool.name === name || tool.alias === name)
