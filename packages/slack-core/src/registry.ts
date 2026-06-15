import {
  chatDeleteScheduledMessage,
  chatPostMessage,
  chatScheduleMessage,
  chatUpdate,
} from "@/tools/chat"
import {
  conversationsHistory,
  conversationsJoin,
  conversationsLeave,
  conversationsList,
  conversationsMark,
  conversationsMembers,
  conversationsOpen,
  conversationsReplies,
  conversationsUnreads,
  usersConversations,
} from "@/tools/conversations"
import { filesInfo } from "@/tools/files"
import { reactionsAdd, reactionsRemove } from "@/tools/reactions"
import { searchFiles, searchMessages } from "@/tools/search"
import {
  usergroupsCreate,
  usergroupsList,
  usergroupsMe,
  usergroupsUpdate,
  usergroupsUsersUpdate,
} from "@/tools/usergroups"
import { usersInfo, usersLookupByEmail, usersSearch } from "@/tools/users"
import type { SlackTool } from "@/types"

export const readTools: SlackTool[] = [
  conversationsHistory,
  conversationsReplies,
  conversationsList,
  conversationsMembers,
  usersConversations,
  conversationsUnreads,
  searchMessages,
  searchFiles,
  usersSearch,
  usersInfo,
  usersLookupByEmail,
  usergroupsList,
  usergroupsMe,
  filesInfo,
]

export const writeTools: SlackTool[] = [
  chatPostMessage,
  chatUpdate,
  chatScheduleMessage,
  chatDeleteScheduledMessage,
  reactionsAdd,
  reactionsRemove,
  conversationsMark,
  conversationsOpen,
  conversationsJoin,
  conversationsLeave,
  usergroupsCreate,
  usergroupsUpdate,
  usergroupsUsersUpdate,
]

export const allTools: SlackTool[] = [...readTools, ...writeTools]

// neutral tier selector; the write-gating policy (env vars, per-tool,
// channel scoping) is decided by the server layer in a later milestone.
export const enabledTools = (allowWrite: boolean): SlackTool[] =>
  allowWrite ? allTools : readTools

export const toolByName = (name: string): SlackTool | undefined =>
  allTools.find((tool) => tool.name === name)
