import { Hono } from "hono";
import { requireUser } from "../auth";
import type { AppVars, Env } from "../env";
import { fail, iso } from "../http";
import { finish, intParam, readJson, requireString } from "../validate";

export const messages = new Hono<{ Bindings: Env; Variables: AppVars }>();
messages.use("*", requireUser);

const messageOut = (m: Record<string, any>) => ({
  content: m.content,
  content_type: m.content_type,
  id: m.id,
  session_id: m.session_id,
  role: m.role,
  audio_url: m.audio_url ?? null,
  video_url: m.video_url ?? null,
  message_metadata: m.message_metadata ?? null,
  created_at: iso(m.created_at),
});

async function ownedSession(c: any, sessionId: string) {
  const s = (await c.var.query("SELECT * FROM sessions WHERE id = $1", [sessionId]))[0];
  if (!s) fail(404, "Session not found");
  if (s.user_id !== c.var.user.id) fail(403, "Not authorised to access this session");
  return s as Record<string, any>;
}

async function ownedMessage(c: any, id: string) {
  const m = (await c.var.query("SELECT * FROM messages WHERE id = $1", [id]))[0];
  if (!m) fail(404, "Message not found");
  await ownedSession(c, m.session_id);
  return m as Record<string, any>;
}

messages.post("/send", async (c) => {
  const body = await readJson(c.req.raw);
  const errs: any[] = [];
  const content = requireString(body.content, "content", errs);
  const sessionId = requireString(body.session_id, "session_id", errs);
  const contentType = body.content_type === undefined ? "text" : requireString(body.content_type, "content_type", errs);
  finish(errs);

  const session = await ownedSession(c, sessionId!);
  if (session.status !== "active") fail(400, "Session is not active");
  const rows = await c.var.query(
    `INSERT INTO messages (id, session_id, role, content, content_type)
     VALUES ($1,$2,'user',$3,$4) RETURNING *`,
    [crypto.randomUUID(), sessionId, content, contentType],
  );
  return c.json(messageOut(rows[0]), 201);
});

messages.get("/session/:session_id", async (c) => {
  const skip = intParam(c.req.query("skip"), 0, 0, 1_000_000, "skip");
  const limit = intParam(c.req.query("limit"), 100, 1, 500, "limit");
  const sessionId = c.req.param("session_id");
  await ownedSession(c, sessionId);
  const rows = await c.var.query(
    "SELECT * FROM messages WHERE session_id = $1 ORDER BY created_at OFFSET $2 LIMIT $3",
    [sessionId, skip, limit],
  );
  return c.json(rows.map(messageOut));
});

messages.get("/:message_id", async (c) => c.json(messageOut(await ownedMessage(c, c.req.param("message_id")))));

messages.patch("/:message_id", async (c) => {
  const m = await ownedMessage(c, c.req.param("message_id"));
  const body = await readJson(c.req.raw);
  const errs: any[] = [];
  const content = requireString(body.content, "content", errs, 8000);
  if (typeof content === "string" && content.length < 1)
    errs.push({ loc: ["body", "content"], msg: "String should have at least 1 character", type: "string_too_short" });
  finish(errs);
  const rows = await c.var.query("UPDATE messages SET content = $2 WHERE id = $1 RETURNING *", [m.id, content!.trim()]);
  return c.json(messageOut(rows[0]));
});

messages.delete("/:message_id", async (c) => {
  const m = await ownedMessage(c, c.req.param("message_id"));
  await c.var.query("DELETE FROM messages WHERE id = $1", [m.id]);
  return c.body(null, 204);
});
