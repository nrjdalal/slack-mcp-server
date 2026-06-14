import { chatPostMessage } from "@/tools/chat"
import {
  conversationsHistory,
  conversationsJoin,
  conversationsLeave,
  conversationsList,
  conversationsMark,
  conversationsReplies,
  conversationsUnreads,
  usersConversations,
} from "@/tools/conversations"
import { filesInfo } from "@/tools/files"
import { reactionsAdd, reactionsRemove } from "@/tools/reactions"
import { searchMessages } from "@/tools/search"
import {
  usergroupsCreate,
  usergroupsList,
  usergroupsMe,
  usergroupsUpdate,
  usergroupsUsersUpdate,
} from "@/tools/usergroups"
import { usersSearch } from "@/tools/users"
import type { SlackTool } from "@/types"

export const readTools: SlackTool[] = [
  conversationsHistory,
  conversationsReplies,
  conversationsList,
  usersConversations,
  conversationsUnreads,
  searchMessages,
  usersSearch,
  usergroupsList,
  usergroupsMe,
  filesInfo,
]

export const writeTools: SlackTool[] = [
  chatPostMessage,
  reactionsAdd,
  reactionsRemove,
  conversationsMark,
  conversationsJoin,
  conversationsLeave,
  usergroupsCreate,
  usergroupsUpdate,
  usergroupsUsersUpdate,
]

export const allTools: SlackTool[] = [...readTools, ...writeTools]

// write tools are opt-in via SLACK_MCP_ALLOW_WRITE
export const enabledTools = (
  allowWrite: boolean = Boolean(process.env.SLACK_MCP_ALLOW_WRITE),
): SlackTool[] => (allowWrite ? allTools : readTools)

export const toolByName = (name: string): SlackTool | undefined =>
  allTools.find((tool) => tool.name === name)
