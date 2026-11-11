import { Hono } from "hono/tiny";
import { requireUser } from "../auth";
import type { AppVars, Env } from "../env";
import { fail, iso } from "../http";
import { intParam, readJson } from "../validate";
import { runSafetyEval } from "../safety";

export const admin = new Hono<{ Bindings: Env; Variables: AppVars }>();
admin.use("*", requireUser);
admin.use("*", async (c, next) => {
  if (!c.var.user!.is_superuser) fail(403, "Administrator access required");
  await next();
});

admin.get("/stats", async (c) => {
  const r = (await c.var.query(
    `SELECT count(*)::int total,
            count(*) FILTER (WHERE collection='medical')::int medical,
            count(*) FILTER (WHERE collection='mental_wellness')::int mental,
            count(*) FILTER (WHERE approved)::int approved FROM knowledge_chunks`,
  ))[0];
  return c.json({
    platform: "MediCare", parent_brand: "Medicus Labs™", timestamp: new Date().toISOString(),
    knowledge_base: {
      total_chunks: r.total, medical_chunks: r.medical, mental_wellness_chunks: r.mental,
      approved_chunks: r.approved, pending_review_chunks: r.total - r.approved, duplicates_filtered: 0,
    },
    languages_supported: ["English", "Kannada (ಕನ್ನಡ)", "Hindi (हिन्दी)"],
    emergency_hotline: "112 (India) / 1800-599-0019 (KIRAN)",
  });
});

admin.get("/knowledge/sources", async (c) => {
  const limit = intParam(c.req.query("limit"), 50, 1, 200, "limit");
  const offset = intParam(c.req.query("offset"), 0, 0, 1_000_000, "offset");
  const where: string[] = [];
  const p: unknown[] = [];
  const add = (sql: string, v: unknown) => { p.push(v); where.push(sql.replace("?", `$${p.length}`)); };
  const col = c.req.query("collection"); if (col) add("collection = ?", col);
  const cat = c.req.query("category"); if (cat) add("category = ?", cat);
  const st = c.req.query("status"); if (st === "approved") where.push("approved"); if (st === "pending") where.push("NOT approved");
  const s = c.req.query("search")?.trim();
  if (s) {
    p.push(`%${s.replace(/[%_\\]/g, "")}%`);
    where.push(`(title ILIKE $${p.length} OR content ILIKE $${p.length})`);
  }
  const w = where.length ? "WHERE " + where.join(" AND ") : "";
  const total = (await c.var.query(`SELECT count(*)::int n FROM knowledge_chunks ${w}`, p))[0].n;
  const rows = await c.var.query(
    `SELECT chunk_id, collection, category, title, left(content,160) AS snippet, source_name, license, approved, origin_url
     FROM knowledge_chunks ${w} ORDER BY chunk_id LIMIT ${limit} OFFSET ${offset}`, p);
  return c.json({ total, limit, offset, chunks: rows.map((r) => ({ ...r, snippet: r.snippet + "...", created_at: null })) });
});

admin.get("/knowledge/sources/:id", async (c) => {
  const r = (await c.var.query("SELECT * FROM knowledge_chunks WHERE chunk_id = $1", [c.req.param("id")]))[0];
  if (!r) fail(404, "Knowledge chunk not found");
  const { tsv: _t, ...rest } = r!;
  return c.json(rest);
});

admin.post("/knowledge/sources/:id/action", async (c) => {
  const b = await readJson(c.req.raw);
  if (b.action !== "approve" && b.action !== "reject") fail(400, "Invalid action: choose approve or reject");
  const rows = await c.var.query("UPDATE knowledge_chunks SET approved = $2 WHERE chunk_id = $1 RETURNING approved", [c.req.param("id"), b.action === "approve"]);
  if (!rows.length) fail(404, "Knowledge chunk not found");
  return c.json({ chunk_id: c.req.param("id"), approved: rows[0].approved, message: `Chunk status updated to ${rows[0].approved ? "Approved" : "Rejected"}` });
});

admin.delete("/knowledge/sources/:id", async (c) => {
  const rows = await c.var.query("DELETE FROM knowledge_chunks WHERE chunk_id = $1 RETURNING collection", [c.req.param("id")]);
  if (!rows.length) fail(404, "Chunk not found");
  return c.json({ deleted: true, chunk_id: c.req.param("id"), collection: rows[0].collection });
});

admin.get("/knowledge/books", (c) => c.json({ books: [] }));
admin.post("/knowledge/books/upload", () => fail(503, "Book processing needs the Python/ML service, which isn't available on the free server."));
admin.post("/knowledge/reindex", async (c) => {
  // Full-text search is indexed automatically by Postgres; nothing to rebuild.
  const n = (await c.var.query("SELECT count(*)::int n FROM knowledge_chunks"))[0].n;
  return c.json({ status: "up_to_date", total_chunks: n, note: "Search index updates automatically; re-run the 'Load Knowledge Base' workflow to re-import the bundled data." });
});
admin.post("/safety/eval", async (c) => {
  const b = await c.req.json().catch(() => ({}));
  const r = runSafetyEval(Number(b?.sample_size) || 20);
  return c.json({ suite: b?.benchmark_suite ?? "ALL", timestamp: new Date().toISOString(), ...r });
});
