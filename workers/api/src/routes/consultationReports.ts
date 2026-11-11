import { Hono } from "hono/tiny";
import { requireUser } from "../auth";
import type { AppVars, Env } from "../env";
import { fail, iso } from "../http";
import { readJson } from "../validate";

export const consultationReports = new Hono<{ Bindings: Env; Variables: AppVars }>();
consultationReports.use("*", requireUser);

const out = (r: Record<string, any>) => ({
  id: r.id, session_id: r.session_id, doctor_id: r.doctor_id, language: r.language,
  triage_level: r.triage_level, duration_seconds: r.duration_seconds, report: r.report,
  created_at: iso(r.created_at),
});

async function ownSession(c: any, id: string) {
  const s = (await c.var.query("SELECT user_id FROM sessions WHERE id = $1", [id]))[0];
  if (!s || s.user_id !== c.var.user!.id) fail(404, "Session not found");
}

consultationReports.put("/:session_id", async (c) => {
  const sid = c.req.param("session_id");
  await ownSession(c, sid);
  const b = await readJson(c.req.raw);
  const bad = (loc: string, msg: string) => c.json({ detail: [{ loc: ["body", loc], msg, type: "value_error" }] }, 422);
  if (!b.report || typeof b.report !== "object" || Array.isArray(b.report)) return bad("report", "Input should be a valid dictionary");
  const tri: any = b.triage_level ?? null, dur: any = b.duration_seconds ?? null;
  if (tri !== null && (!Number.isInteger(tri) || tri < 1 || tri > 4)) return bad("triage_level", "Input should be between 1 and 4");
  if (dur !== null && (!Number.isInteger(dur) || dur < 0)) return bad("duration_seconds", "Input should be >= 0");
  const rows = await c.var.query(
    `INSERT INTO consultation_reports (id, session_id, user_id, doctor_id, language, triage_level, duration_seconds, report)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
     ON CONFLICT (session_id) DO UPDATE SET doctor_id = EXCLUDED.doctor_id, language = EXCLUDED.language,
       triage_level = EXCLUDED.triage_level, duration_seconds = EXCLUDED.duration_seconds,
       report = EXCLUDED.report, updated_at = now()
     RETURNING *`,
    [crypto.randomUUID(), sid, c.var.user!.id, String(b.doctor_id ?? "").slice(0, 64) || null,
     String(b.language ?? "").slice(0, 16) || null, tri, dur, JSON.stringify(b.report)],
  );
  return c.json(out(rows[0]));
});

consultationReports.get("/:session_id", async (c) => {
  const sid = c.req.param("session_id");
  await ownSession(c, sid);
  const r = (await c.var.query("SELECT * FROM consultation_reports WHERE session_id = $1", [sid]))[0];
  if (!r) fail(404, "No report yet");
  return c.json(out(r));
});
