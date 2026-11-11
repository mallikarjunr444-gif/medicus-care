import { Hono } from "hono/tiny";
import { requireUser } from "../auth";
import type { AppVars, Env } from "../env";
import { fail, iso } from "../http";
import { intParam, readJson } from "../validate";
import { modelFor } from "../ws";

export const conversations = new Hono<{ Bindings: Env; Variables: AppVars }>();
conversations.use("*", requireUser);

const out = (c: Record<string, any>, count?: number) => ({
  id: c.id,
  session_id: c.session_id,
  title: c.title ?? null,
  summary: c.summary ?? null,
  message_count: count ?? c.message_count ?? 0,
  created_at: iso(c.created_at),
  updated_at: iso(c.updated_at),
});

const WITH_COUNT = `SELECT c.*, (SELECT count(*)::int FROM messages m WHERE m.session_id = c.session_id) AS live_count
  FROM conversations c JOIN sessions s ON s.id = c.session_id`;

async function ownedConversation(c: any, id: string) {
  const rows = await c.var.query(`${WITH_COUNT} WHERE c.id = $1`, [id]);
  const row = rows[0];
  if (!row) fail(404, "Conversation not found");
  const s = (await c.var.query("SELECT user_id FROM sessions WHERE id = $1", [row.session_id]))[0];
  if (!s || s.user_id !== c.var.user!.id) fail(403, "Not authorised");
  return row as Record<string, any>;
}

conversations.get("/", async (c) => {
  const skip = intParam(c.req.query("skip"), 0, 0, 1_000_000, "skip");
  const limit = intParam(c.req.query("limit"), 50, 1, 200, "limit");
  const rows = await c.var.query(
    `${WITH_COUNT} WHERE s.user_id = $1 ORDER BY c.created_at DESC OFFSET $2 LIMIT $3`,
    [c.var.user!.id, skip, limit],
  );
  return c.json(rows.map((r) => out(r, r.live_count)));
});

conversations.get("/session/:session_id", async (c) => {
  const sid = c.req.param("session_id");
  const s = (await c.var.query("SELECT user_id FROM sessions WHERE id = $1", [sid]))[0];
  if (!s) fail(404, "Session not found");
  if (s!.user_id !== c.var.user!.id) fail(403, "Not authorised");
  const rows = await c.var.query(`${WITH_COUNT} WHERE c.session_id = $1 ORDER BY c.created_at DESC`, [sid]);
  return c.json(rows.map((r) => out(r, r.live_count)));
});

conversations.post("/session/:session_id", async (c) => {
  const sid = c.req.param("session_id");
  const s = (await c.var.query("SELECT user_id, status FROM sessions WHERE id = $1", [sid]))[0];
  if (!s) fail(404, "Session not found");
  if (s!.user_id !== c.var.user!.id) fail(403, "Not authorised");
  if (s!.status !== "active") fail(400, "Session is not active");
  const rows = await c.var.query(
    `INSERT INTO conversations (id, session_id, title, message_count) VALUES ($1,$2,'New Conversation',0) RETURNING *`,
    [crypto.randomUUID(), sid],
  );
  return c.json(out(rows[0], 0), 201);
});

conversations.get("/:id", async (c) => {
  const r = await ownedConversation(c, c.req.param("id"));
  return c.json(out(r, r.live_count));
});

conversations.patch("/:id/rename", async (c) => {
  const row = await ownedConversation(c, c.req.param("id"));
  const body = await readJson(c.req.raw);
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title || title.length > 200)
    return c.json({ detail: [{ loc: ["body", "title"], msg: "String should have 1 to 200 characters", type: "string_length" }] }, 422);
  const rows = await c.var.query("UPDATE conversations SET title = $2, updated_at = now() WHERE id = $1 RETURNING *", [row.id, title]);
  return c.json(out(rows[0], row.live_count));
});

conversations.post("/:id/summarize", async (c) => {
  const row = await ownedConversation(c, c.req.param("id"));
  const msgs = await c.var.query(
    "SELECT role, content FROM messages WHERE session_id = $1 AND role IN ('user','assistant') ORDER BY created_at",
    [row.session_id],
  );
  if (!msgs.length) fail(400, "Nothing to summarize — conversation has no messages yet");
  let transcript = msgs.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");
  if (transcript.length > 12000) transcript = "[…earlier turns truncated…]\n" + transcript.slice(-12000);
  if (!c.env.AI) fail(503, "Summary service is misconfigured");
  let text = "";
  try {
    const r: any = await c.env.AI!.run(modelFor(c.env, "en"), {
      messages: [
        { role: "system", content: "You write concise neutral summaries." },
        {
          role: "user",
          content:
            "Summarize the conversation below in 2–3 short sentences. Focus on what was discussed and any conclusions. Write in third person. Do not start with 'This conversation' or 'The user'. No preamble.\n\n" +
            transcript,
        },
      ],
      max_tokens: 200,
    });
    text = String(r?.response ?? "").trim();
  } catch {
    fail(502, "Summary service unavailable");
  }
  const rows = await c.var.query("UPDATE conversations SET summary = $2, updated_at = now() WHERE id = $1 RETURNING *", [row.id, text]);
  return c.json(out(rows[0], row.live_count));
});

conversations.delete("/:id", async (c) => {
  const row = await ownedConversation(c, c.req.param("id"));
  await c.var.query("DELETE FROM conversations WHERE id = $1", [row.id]);
  return c.body(null, 204);
});
