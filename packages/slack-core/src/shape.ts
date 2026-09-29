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
    subtype: m.subtype,
    text: m.text,
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
