import { Hono } from "hono/tiny";
import {
  BCRYPT_COST, clearAuthCookie, createAccessToken, requireUser, setAuthCookie,
} from "../auth";
import type { AppVars, DbUser, Env } from "../env";
import { fail, iso } from "../http";
import { checkEmail, checkOptionalName, checkPassword, checkUsername, finish, intParam, readJson } from "../validate";

export const users = new Hono<{ Bindings: Env; Variables: AppVars }>();

/** UserResponse: password hash and superuser flag are never exposed. */
export const userOut = (u: DbUser) => ({
  email: u.email,
  username: u.username,
  full_name: u.full_name,
  id: u.id,
  is_active: u.is_active,
  is_guest: u.is_guest ?? false,
  created_at: iso(u.created_at),
});

users.post("/register", async (c) => {
  const body = await readJson(c.req.raw);
  const errs: any[] = [];
  const email = checkEmail(body.email, errs);
  const username = checkUsername(body.username, errs);
  const fullName = checkOptionalName(body.full_name, errs);
  const password = checkPassword(body.password, errs);
  finish(errs);

  const q = c.var.query;
  if ((await q("SELECT 1 FROM users WHERE email = $1", [email])).length) fail(409, "Email already registered");
  if ((await q("SELECT 1 FROM users WHERE username = $1", [username])).length) fail(409, "Username already taken");

  const rows = await q(
    `INSERT INTO users (id, email, username, hashed_password, full_name, is_active, is_superuser, is_guest)
     VALUES ($1,$2,$3,crypt($4, gen_salt('bf', ${BCRYPT_COST})),$5,true,false,false) RETURNING *`,
    [crypto.randomUUID(), email, username, password, fullName ?? null],
  );
  return c.json(userOut(rows[0] as DbUser), 201);
});

users.post("/login", async (c) => {
  // OAuth2 password form: application/x-www-form-urlencoded username + password
  const form = await c.req.parseBody().catch(() => ({} as Record<string, unknown>));
  const username = typeof form.username === "string" ? form.username : "";
  const password = typeof form.password === "string" ? form.password : "";
  if (!username || (!password && form.password === undefined)) {
    return c.json({ detail: [{ loc: ["body", "username"], msg: "Field required", type: "missing" }] }, 422);
  }
  const email = username.trim().toLowerCase();
  // Verified in Postgres. Python writes `$2b$` hashes; pgcrypto wants `$2a$`
  // (identical for passwords under 255 bytes), so normalise the prefix. Non-bcrypt
  // hashes (e.g. the guest "*") never match.
  const user = (
    await c.var.query(
      `SELECT *, (hashed_password LIKE '$2%' AND
                  regexp_replace(hashed_password, '^[$]2[by][$]', '$2a$') =
                  crypt($2, regexp_replace(hashed_password, '^[$]2[by][$]', '$2a$'))) AS pw_ok
         FROM users WHERE email = $1`,
      [email, password],
    )
  )[0] as (DbUser & { pw_ok: boolean }) | undefined;

  if (!password || !user || !user.hashed_password || !user.pw_ok) {
    fail(401, "Incorrect email or password", { "WWW-Authenticate": "Bearer" });
  }
  if (!user!.is_active) fail(403, "Inactive user");

  const token = await createAccessToken(c.env, user!.id);
  setAuthCookie(c, token);
  return c.json({ access_token: token, token_type: "bearer" });
});

users.post("/guest", async (c) => {
  if (c.env.GUEST_ACCOUNTS_ENABLED !== "true") fail(403, "Guest access is disabled on this deployment");
  const marker = crypto.randomUUID().replaceAll("-", "");
  const id = `guest-${marker}`;
  await c.var.query(
    `INSERT INTO users (id, email, username, hashed_password, full_name, is_active, is_superuser, is_guest)
     VALUES ($1,$2,$3,'*','Guest',true,false,true)`,
    [id, `guest-${marker}@guests.example.com`, `guest-${marker.slice(0, 12)}`],
  );
  const token = await createAccessToken(c.env, id);
  setAuthCookie(c, token);
  return c.json({ access_token: token, token_type: "bearer" }, 201);
});

users.post("/logout", (c) => {
  clearAuthCookie(c);
  return c.json({ detail: "Logged out" });
});

users.get("/me", requireUser, (c) => c.json(userOut(c.var.user!)));

users.put("/me", requireUser, async (c) => {
  const me = c.var.user!;
  const body = await readJson(c.req.raw);
  const errs: any[] = [];
  const email = body.email != null ? checkEmail(body.email, errs) : undefined;
  const username = body.username != null ? checkUsername(body.username, errs) : undefined;
  const fullName = checkOptionalName(body.full_name, errs);
  const password = body.password != null ? checkPassword(body.password, errs) : undefined;
  finish(errs);

  const q = c.var.query;
  if (email !== undefined && (await q("SELECT 1 FROM users WHERE email = $1 AND id <> $2", [email, me.id])).length)
    fail(409, "Email already registered");
  if (username !== undefined && (await q("SELECT 1 FROM users WHERE username = $1 AND id <> $2", [username, me.id])).length)
    fail(409, "Username already taken");

  const rows = await q(
    `UPDATE users SET
       email = COALESCE($2, email),
       username = COALESCE($3, username),
       full_name = COALESCE($4, full_name),
       hashed_password = COALESCE(crypt($5, gen_salt('bf', ${BCRYPT_COST})), hashed_password),
       updated_at = now()
     WHERE id = $1 RETURNING *`,
    [me.id, email ?? null, username ?? null, fullName ?? null, password ?? null],
  );
  return c.json(userOut(rows[0] as DbUser));
});

users.get("/", requireUser, async (c) => {
  if (!c.var.user!.is_superuser) fail(403, "Not authorized");
  const skip = intParam(c.req.query("skip"), 0, 0, 1_000_000, "skip");
  const limit = Math.min(intParam(c.req.query("limit"), 100, 0, 1_000_000, "limit"), 200);
  const rows = await c.var.query("SELECT * FROM users OFFSET $1 LIMIT $2", [skip, limit]);
  return c.json(rows.map((r) => userOut(r as DbUser)));
});

users.get("/:user_id", requireUser, async (c) => {
  const id = c.req.param("user_id");
  const me = c.var.user!;
  if (me.id !== id && !me.is_superuser) fail(403, "Not authorized");
  const row = (await c.var.query("SELECT * FROM users WHERE id = $1", [id]))[0] as DbUser | undefined;
  if (!row) fail(404, "User not found");
  return c.json(userOut(row!));
});
