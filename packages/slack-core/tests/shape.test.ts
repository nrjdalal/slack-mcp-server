import { expect, test } from "bun:test"

import type { WebClient } from "@slack/web-api"

import { shapeChannel, shapeFile, shapeMessage, shapeUser } from "@/shape"
import { conversationsHistory } from "@/tools/conversations"
import { searchFiles } from "@/tools/search"
import { usersInfo } from "@/tools/users"

const slackMessage = {
  type: "message",
  ts: "1700000000.000100",
  thread_ts: "1700000000.000100",
  user: "U1",
  text: "ship it",
  reply_count: 2,
  team: "T1",
  client_msg_id: "3f2a",
  blocks: [{ type: "rich_text", elements: [{ type: "rich_text_section", elements: [] }] }],
  user_profile: { avatar_hash: "a", display_name: "ada", image_72: "https://x" },
  reactions: [{ name: "rocket", count: 3, users: ["U2", "U3", "U4"] }],
  files: [{ id: "F1", name: "plan.pdf", mimetype: "application/pdf", url_private: "https://x" }],
  attachments: [],
  edited: { user: "U1", ts: "1700000001.000000" },
}

test("a message keeps what an agent reads and drops blocks, profiles and empties", () => {
  expect(shapeMessage(slackMessage)).toEqual({
    ts: "1700000000.000100",
    thread_ts: "1700000000.000100",
    user: "U1",
    text: "ship it",
    reply_count: 2,
    reactions: [{ name: "rocket", count: 3 }],
    files: [{ id: "F1", name: "plan.pdf", mimetype: "application/pdf" }],
  })
})

test("a search match keeps its channel id and name and its permalink", () => {
  const shaped = shapeMessage({
    ts: "1.2",
    text: "x",
    username: "ada",
    channel: { id: "C1", name: "general", is_channel: true, is_private: false },
    permalink: "https://slack.com/archives/C1/p12",
  })
  expect(shaped).toEqual({
    ts: "1.2",
    text: "x",
    username: "ada",
    channel: { id: "C1", name: "general" },
    permalink: "https://slack.com/archives/C1/p12",
  })
})

test("a channel flattens topic and purpose and drops empty ones", () => {
  expect(
    shapeChannel({
      id: "C1",
      name: "general",
      is_private: false,
      is_member: true,
      num_members: 40,
      topic: { value: "launch", creator: "U1", last_set: 1 },
      purpose: { value: "", creator: "", last_set: 0 },
      created: 1,
      name_normalized: "general",
      previous_names: [],
      shared_team_ids: ["T1"],
    }),
  ).toEqual({
    id: "C1",
    name: "general",
    is_private: false,
    is_member: true,
    num_members: 40,
    topic: "launch",
  })
})

test("a user reads its display name, email and title from the profile", () => {
  expect(
    shapeUser({
      id: "U1",
      name: "ada",
      real_name: "Ada Lovelace",
      tz: "Europe/London",
      is_bot: false,
      color: "9f69e7",
      profile: { display_name: "ada", email: "ada@x.dev", title: "", image_512: "https://x" },
    }),
  ).toEqual({
    id: "U1",
    name: "ada",
    real_name: "Ada Lovelace",
    display_name: "ada",
    email: "ada@x.dev",
    tz: "Europe/London",
    is_bot: false,
  })
})

test("a file keeps its identity and drops thumbnails and private URLs", () => {
  expect(
    shapeFile({
      id: "F1",
      name: "plan.pdf",
      title: "Plan",
      mimetype: "application/pdf",
      filetype: "pdf",
      size: 1234,
      user: "U1",
      created: 1,
      permalink: "https://slack.com/files/U1/F1/plan.pdf",
      url_private: "https://files.slack.com/x",
      thumb_pdf: "https://files.slack.com/t",
      shares: { public: { C1: [{ ts: "1.2" }] } },
    }),
  ).toEqual({
    id: "F1",
    name: "plan.pdf",
    title: "Plan",
    mimetype: "application/pdf",
    filetype: "pdf",
    size: 1234,
    user: "U1",
    created: 1,
    permalink: "https://slack.com/files/U1/F1/plan.pdf",
  })
})

test("raw: true returns Slack's objects untouched", async () => {
  const client = {
    conversations: { history: async () => ({ ok: true, messages: [slackMessage] }) },
  } as unknown as WebClient
  const shaped = (await conversationsHistory.handler(client, { channel: "C1", limit: 1 })) as {
    messages: unknown[]
  }
  const raw = (await conversationsHistory.handler(client, {
    channel: "C1",
    limit: 1,
    raw: true,
  })) as { messages: unknown[] }
  expect(raw.messages[0]).toBe(slackMessage)
  expect(JSON.stringify(shaped.messages[0]).length).toBeLessThan(
    JSON.stringify(slackMessage).length / 2,
  )
})

test("users_info returns a trimmed user, and Slack's object with raw", async () => {
  const slackUser = {
    id: "U1",
    name: "ada",
    color: "9f69e7",
    profile: { email: "ada@x.dev", image_512: "https://x" },
  }
  const client = {
    users: { info: async () => ({ ok: true, user: slackUser }) },
  } as unknown as WebClient
  const shaped = (await usersInfo.handler(client, { user: "U1" })) as { user: unknown }
  const raw = (await usersInfo.handler(client, { user: "U1", raw: true })) as { user: unknown }
  expect(shaped.user).toEqual({ id: "U1", name: "ada", email: "ada@x.dev" })
  expect(raw.user).toBe(slackUser)
})

test("search_files trims each matched file", async () => {
  const client = {
    search: {
      files: async () => ({
        ok: true,
        files: {
          matches: [{ id: "F1", name: "a.txt", url_private: "https://x", thumb_64: "https://t" }],
          total: 1,
        },
      }),
    },
  } as unknown as WebClient
  const out = (await searchFiles.handler(client, { query: "a" })) as { matches: unknown[] }
  expect(out.matches).toEqual([{ id: "F1", name: "a.txt" }])
})

test("a bot post with no text keeps its attachment text and its bot's name", () => {
  const shaped = shapeMessage({
    ts: "1.1",
    bot_id: "B1",
    subtype: "bot_message",
    text: "",
    bot_profile: { id: "B1", name: "Datadog", icons: { image_36: "https://x" } },
    attachments: [
      { fallback: "CPU high", title: "CPU high", text: "web-1 at 97%", color: "danger" },
    ],
  })
  expect(shaped).toEqual({
    ts: "1.1",
    bot_id: "B1",
    bot_name: "Datadog",
    subtype: "bot_message",
    text: "CPU high\nweb-1 at 97%",
  })
})

test("a blocks-only post takes its text from the blocks, and text is not doubled", () => {
  const blocks = [
    { type: "header", text: { type: "plain_text", text: "Deploy done" } },
    {
      type: "rich_text",
      elements: [
        {
          type: "rich_text_section",
          elements: [
            { type: "text", text: "see " },
            { type: "link", url: "https://ci", text: "the run" },
          ],
        },
      ],
    },
    { type: "section", fields: [{ type: "mrkdwn", text: "*env* prod" }] },
  ]
  expect(shapeMessage({ ts: "1.2", bot_id: "B1", blocks }).text).toBe(
    "Deploy done\nsee the run\n*env* prod",
  )
  expect(shapeMessage({ ts: "1.3", user: "U1", text: "hello", blocks }).text).toBe("hello")
})

test("rich text keeps its paragraphs and list items apart, with bare links and mentions", () => {
  const section = (...elements: unknown[]) => ({ type: "rich_text_section", elements })
  const blocks = [
    {
      type: "rich_text",
      elements: [
        section({ type: "text", text: "Deploy failed" }),
        {
          type: "rich_text_list",
          style: "bullet",
          elements: [
            section({ type: "text", text: "api" }),
            section({ type: "text", text: "worker" }),
          ],
        },
        section(
          { type: "text", text: "logs: " },
          { type: "link", url: "https://ci.example/run/42" },
          { type: "text", text: " cc " },
          { type: "user", user_id: "U9" },
        ),
      ],
    },
  ]
  expect(shapeMessage({ ts: "1.4", bot_id: "B1", blocks }).text).toBe(
    "Deploy failed\napi\nworker\nlogs: https://ci.example/run/42 cc <@U9>",
  )
})
