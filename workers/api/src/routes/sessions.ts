import { Hono } from "hono";
import { requireUser } from "../auth";
import type { AppVars, Env } from "../env";
import { fail, iso } from "../http";
import { finish, intParam, readJson, requireString } from "../validate";

export const sessions = new Hono<{ Bindings: Env; Variables: AppVars }>();
sessions.use("*", requireUser);

export const sessionOut = (s: Record<string, any>) => ({
  id: s.id,
  user_id: s.user_id,
  avatar_id: s.avatar_id,
  status: s.status,
  settings: s.settings ?? null,
  started_at: iso(s.started_at),
  ended_at: iso(s.ended_at),
});

const EXPORT_MAX_MESSAGES = 5000;

async function owned(c: any, id: string) {
  const s = (await c.var.query("SELECT * FROM sessions WHERE id = $1", [id]))[0];
  if (!s) fail(404, "Session not found");
  return s as Record<string, any>;
}

sessions.post("/create", async (c) => {
  const body = await readJson(c.req.raw);
  const errs: any[] = [];
  const avatarId = requireString(body.avatar_id, "avatar_id", errs);
  if (body.settings != null && (typeof body.settings !== "object" || Array.isArray(body.settings)))
    errs.push({ loc: ["body", "settings"], msg: "Input should be a valid dictionary", type: "dict_type" });
  finish(errs);

  const q = c.var.query;
  const avatar = (await q("SELECT * FROM avatars WHERE id = $1", [avatarId]))[0];
  if (!avatar) fail(404, "Avatar not found");
  if (avatar!.status !== "ready") fail(400, "Avatar is not ready");
  if (avatar!.user_id !== c.var.user!.id) fail(403, "Not authorised to use this avatar");

  const rows = await q(
    `INSERT INTO sessions (id, user_id, avatar_id, status, settings)
     VALUES ($1,$2,$3,'active',$4::jsonb) RETURNING *`,
    [crypto.randomUUID(), c.var.user!.id, avatarId, JSON.stringify(body.settings ?? {})],
  );
  return c.json(sessionOut(rows[0]), 201);
});

sessions.get("/", async (c) => {
  const skip = intParam(c.req.query("skip"), 0, 0, 1_000_000, "skip");
  const limit = intParam(c.req.query("limit"), 50, 1, 200, "limit");
  const rows = await c.var.query(
    "SELECT * FROM sessions WHERE user_id = $1 ORDER BY started_at DESC OFFSET $2 LIMIT $3",
    [c.var.user!.id, skip, limit],
  );
  return c.json(rows.map(sessionOut));
});

sessions.get("/:session_id", async (c) => {
  const s = await owned(c, c.req.param("session_id"));
  if (s.user_id !== c.var.user!.id) fail(403, "Not authorised to access this session");
  return c.json(sessionOut(s));
});

sessions.post("/:session_id/end", async (c) => {
  const s = await owned(c, c.req.param("session_id"));
  if (s.user_id !== c.var.user!.id) fail(403, "Not authorised to end this session");
  const rows = await c.var.query(
    "UPDATE sessions SET status = 'ended', ended_at = now() WHERE id = $1 RETURNING *",
    [s.id],
  );
  // NOTE: the Python API also closes the live WebSocket here. The WebSocket
  // pipeline stays on the Python service, so that service closes it itself.
  return c.json(sessionOut(rows[0]));
});

sessions.get("/:session_id/export", async (c) => {
  const s = await owned(c, c.req.param("session_id"));
  if (s.user_id !== c.var.user!.id) fail(403, "Not authorised");
  const msgs = await c.var.query(
    "SELECT * FROM messages WHERE session_id = $1 ORDER BY created_at, id LIMIT $2",
    [s.id, EXPORT_MAX_MESSAGES + 1],
  );
  const truncated = msgs.length > EXPORT_MAX_MESSAGES;
  const list = truncated ? msgs.slice(0, EXPORT_MAX_MESSAGES) : msgs;
  return c.json(
    {
      session: {
        id: s.id, avatar_id: s.avatar_id, status: s.status,
        started_at: iso(s.started_at), ended_at: iso(s.ended_at),
      },
      messages: list.map((m) => ({
        id: m.id, role: m.role, content: m.content, content_type: m.content_type,
        created_at: iso(m.created_at), latency: m.latency,
      })),
      exported_at: new Date().toISOString(),
      truncated,
      max_messages: truncated ? EXPORT_MAX_MESSAGES : null,
    },
    200,
    {
      "Content-Disposition": `attachment; filename="session-${String(s.id).slice(0, 8)}.json"`,
      "Cache-Control": "no-store",
    },
  );
});

sessions.delete("/:session_id", async (c) => {
  const s = await owned(c, c.req.param("session_id"));
  if (s.user_id !== c.var.user!.id) fail(403, "Not authorised to delete this session");
  await c.var.query("DELETE FROM sessions WHERE id = $1", [s.id]); // FK cascades
  return c.body(null, 204);
});
