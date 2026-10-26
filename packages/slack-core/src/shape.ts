// Trimmed projections of Slack objects: the fields an agent reads, so a page of results costs a fraction of the raw JSON. Tools return these unless called with raw: true.

import { z } from "zod"

type Obj = Record<string, unknown>

export const rawInput = z
  .boolean()
  .default(false)
  .describe("Return Slack's full objects instead of the trimmed fields.")

const obj = (value: unknown): Obj =>
  value !== null && typeof value === "object" ? (value as Obj) : {}

// Drops what Slack left empty, so a trimmed object carries only fields that say something.
const compact = (fields: Obj): Obj =>
  Object.fromEntries(
    Object.entries(fields).filter(
      ([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0),
    ),
  )

const list = <T>(value: unknown, map: (item: Obj) => T): T[] | undefined =>
  Array.isArray(value) ? value.map((item) => map(obj(item))) : undefined

export const shapeChannel = (value: unknown): Obj => {
  const c = obj(value)
  return compact({
    id: c.id,
    name: c.name,
    user: c.user,
    is_private: c.is_private,
    is_im: c.is_im,
    is_mpim: c.is_mpim,
    is_archived: c.is_archived,
    is_member: c.is_member,
    num_members: c.num_members,
    topic: obj(c.topic).value,
    purpose: obj(c.purpose).value,
  })
}

const nonEmpty = (values: unknown[]): string[] =>
  values.filter((v): v is string => typeof v === "string" && v !== "")

// Every string under a "text" key, at any depth: how blocks hold their words.
const texts = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.flatMap(texts)
    : Object.entries(obj(value)).flatMap(([key, v]) =>
        key === "text" && typeof v === "string" ? [v] : typeof v === "object" ? texts(v) : [],
      )

const blockText = (blocks: unknown): string =>
  nonEmpty(list(blocks, (b) => texts(b).join(b.type === "rich_text" ? "" : "\n")) ?? []).join("\n")

const attachmentText = (attachments: unknown): string =>
  nonEmpty(
    list(attachments, (a) => {
      const fields = list(a.fields, (f) => nonEmpty([f.title, f.value]).join(": ")) ?? []
      return nonEmpty([a.pretext, a.title, a.text, ...fields]).join("\n") || a.fallback
    }) ?? [],
  ).join("\n")

// A bot post often leaves text empty and carries its words in blocks or attachments.
const messageText = (m: Obj): string =>
  nonEmpty([nonEmpty([m.text])[0] ?? blockText(m.blocks), attachmentText(m.attachments)]).join("\n")

export const shapeMessage = (value: unknown): Obj => {
  const m = obj(value)
  const channel = obj(m.channel)
  return compact({
    ts: m.ts,
    thread_ts: m.thread_ts,
    channel: channel.id === undefined ? undefined : compact({ id: channel.id, name: channel.name }),
    user: m.user,
    username: m.username,
    bot_id: m.bot_id,
    bot_name: obj(m.bot_profile).name,
    subtype: m.subtype,
    text: messageText(m),
    reply_count: m.reply_count,
    reactions: list(m.reactions, (r) => ({ name: r.name, count: r.count })),
    files: list(m.files, (f) => compact({ id: f.id, name: f.name, mimetype: f.mimetype })),
    permalink: m.permalink,
  })
}

export const shapeUser = (value: unknown): Obj => {
  const u = obj(value)
  const profile = obj(u.profile)
  return compact({
    id: u.id,
    name: u.name,
    real_name: u.real_name,
    display_name: profile.display_name,
    email: profile.email,
    title: profile.title,
    tz: u.tz,
    is_bot: u.is_bot,
    deleted: u.deleted,
  })
}

export const shapeFile = (value: unknown): Obj => {
  const f = obj(value)
  return compact({
    id: f.id,
    name: f.name,
    title: f.title,
    mimetype: f.mimetype,
    filetype: f.filetype,
    size: f.size,
    user: f.user,
    created: f.created,
    permalink: f.permalink,
  })
}

// The shared input flag: the trimmed shape by default, Slack's full objects on request.
export const shapeAll = <T>(raw: boolean, items: T[], shape: (value: unknown) => Obj) =>
  raw ? items : items.map(shape)
