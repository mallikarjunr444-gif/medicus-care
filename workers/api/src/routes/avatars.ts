import { Hono } from "hono/tiny";
import { requireUser } from "../auth";
import type { AppVars, Env } from "../env";
import { fail, iso } from "../http";
import { readJson } from "../validate";

export const avatars = new Hono<{ Bindings: Env; Variables: AppVars }>();
avatars.use("*", requireUser);

const MAX_IMAGE_BYTES = 1_500_000;
const out = (a: Record<string, any>) => ({
  id: a.id, user_id: a.user_id, name: a.name, image_url: a.image_url, thumbnail_url: a.thumbnail_url ?? null,
  status: a.status, voice_id: a.voice_id ?? null, avatar_metadata: a.avatar_metadata ?? null, created_at: iso(a.created_at),
});

function imageMime(b: Uint8Array): string | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45) return "image/webp";
  return null;
}
const b64 = (b: Uint8Array) => {
  let s = "";
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
};

async function owned(c: any, id: string) {
  const a = (await c.var.query("SELECT * FROM avatars WHERE id = $1", [id]))[0];
  if (!a) fail(404, "Avatar not found");
  if (a!.user_id !== c.var.user!.id) fail(403, "Not authorised to modify this avatar");
  return a as Record<string, any>;
}

// Images are stored inline (data URL) in Postgres: no object storage is needed on the free plan.
avatars.post("/upload", async (c) => {
  const form = await c.req.formData().catch(() => null);
  const name = String(form?.get("name") ?? "").trim();
  const file = form?.get("file");
  if (!name || name.length > 200) return c.json({ detail: [{ loc: ["body", "name"], msg: "Name is required (max 200)", type: "value_error" }] }, 422);
  if (!(file instanceof File)) fail(400, "File must be an image (JPG, PNG, WEBP)");
  const f = file as File;
  if (f.size > MAX_IMAGE_BYTES) fail(400, "Image is too large (max 1.5 MB). Please resize it and try again.");
  const bytes = new Uint8Array(await f.arrayBuffer());
  const mime = imageMime(bytes);
  if (!mime) fail(400, "File must be an image (JPG, PNG, WEBP)");
  const id = crypto.randomUUID();
  const url = `data:${mime};base64,${b64(bytes)}`;
  const rows = await c.var.query(
    `INSERT INTO avatars (id, user_id, name, image_url, thumbnail_url, s3_key, status, avatar_metadata)
     VALUES ($1,$2,$3,$4,$4,$5,'ready','{}'::jsonb) RETURNING *`,
    [id, c.var.user!.id, name, url, `inline/${id}`],
  );
  return c.json(out(rows[0]), 201);
});

avatars.get("/", async (c) => {
  const rows = await c.var.query("SELECT * FROM avatars WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100", [c.var.user!.id]);
  return c.json(rows.map(out));
});

avatars.get("/:id", async (c) => c.json(out(await owned(c, c.req.param("id")))));

avatars.put("/:id/voice", async (c) => {
  const a = await owned(c, c.req.param("id"));
  const v = (c.req.query("voice_id") ?? "").trim() || null;
  const rows = await c.var.query("UPDATE avatars SET voice_id = $2, updated_at = now() WHERE id = $1 RETURNING *", [a.id, v]);
  return c.json(out(rows[0]));
});

avatars.patch("/:id/name", async (c) => {
  const a = await owned(c, c.req.param("id"));
  const b = await readJson(c.req.raw);
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name || name.length > 200) return c.json({ detail: [{ loc: ["body", "name"], msg: "String should have 1 to 200 characters", type: "string_length" }] }, 422);
  const rows = await c.var.query("UPDATE avatars SET name = $2, updated_at = now() WHERE id = $1 RETURNING *", [a.id, name]);
  return c.json(out(rows[0]));
});

avatars.patch("/:id/metadata", async (c) => {
  const a = await owned(c, c.req.param("id"));
  const b = await readJson(c.req.raw);
  const sp = b.system_prompt;
  if (sp != null && (typeof sp !== "string" || sp.length > 8000))
    return c.json({ detail: [{ loc: ["body", "system_prompt"], msg: "String should have at most 8000 characters", type: "string_too_long" }] }, 422);
  const patch: Record<string, unknown> = {};
  if (sp != null) patch.system_prompt = sp;
  const rows = await c.var.query(
    "UPDATE avatars SET avatar_metadata = COALESCE(avatar_metadata::jsonb, '{}'::jsonb) || $2::jsonb, updated_at = now() WHERE id = $1 RETURNING *",
    [a.id, JSON.stringify(patch)],
  );
  return c.json(out(rows[0]));
});

avatars.delete("/:id", async (c) => {
  const a = await owned(c, c.req.param("id"));
  await c.var.query("DELETE FROM avatars WHERE id = $1", [a.id]);
  return c.body(null, 204);
});
