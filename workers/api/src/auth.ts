import type { Context, MiddlewareHandler } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { AppVars, DbUser, Env } from "./env";
import { fail } from "./http";

type C = Context<{ Bindings: Env; Variables: AppVars }>;

const enc = new TextEncoder();
const b64u = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64uDecode = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const hmacKey = (env: Env, usage: "sign" | "verify") =>
  crypto.subtle.importKey("raw", enc.encode(env.JWT_SECRET_KEY), { name: "HMAC", hash: "SHA-256" }, false, [usage]);

/** Same wire format as the Python API: HS256, `sub` = user id, `exp` required. */
export async function createAccessToken(env: Env, sub: string): Promise<string> {
  const hours = Number(env.JWT_EXPIRATION_HOURS) || 24;
  const head = b64u(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64u(enc.encode(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + hours * 3600 })));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(env, "sign"), enc.encode(`${head}.${body}`)));
  return `${head}.${body}.${b64u(sig)}`;
}

/** Returns the user id (`sub`) of a valid token, else null. Algorithm is pinned to HS256. */
export async function subjectFromToken(env: Env, token: string): Promise<string | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const header = JSON.parse(new TextDecoder().decode(b64uDecode(parts[0])));
    if (header.alg !== "HS256") return null; // rejects alg:none and algorithm confusion
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(env, "verify"), b64uDecode(parts[2]), enc.encode(`${parts[0]}.${parts[1]}`));
    if (!ok) return null;
    const p = JSON.parse(new TextDecoder().decode(b64uDecode(parts[1])));
    if (typeof p.exp !== "number" || p.exp <= Date.now() / 1000) return null;
    return typeof p.sub === "string" ? p.sub : null;
  } catch {
    return null;
  }
}

// Password hashing runs INSIDE Postgres (pgcrypto bcrypt, `$2a$` format): the
// Workers Free plan allows ~10 ms CPU per request and pure-JS bcrypt needs
// 80-300 ms. pgcrypto output is interchangeable with Python's bcrypt, so
// existing hashes keep working. Passwords travel to the database only over
// TLS, as bound query parameters (never interpolated, never logged).
export const BCRYPT_COST = 10;

const sameSite = (v: string) => (v.toLowerCase() === "none" ? "None" : v.toLowerCase() === "strict" ? "Strict" : "Lax") as "None" | "Strict" | "Lax";

export function setAuthCookie(c: C, token: string): void {
  const e = c.env;
  setCookie(c, e.AUTH_COOKIE_NAME, token, {
    maxAge: (Number(e.JWT_EXPIRATION_HOURS) || 24) * 3600,
    httpOnly: true,
    secure: e.AUTH_COOKIE_SECURE === "true",
    sameSite: sameSite(e.AUTH_COOKIE_SAMESITE),
    domain: e.AUTH_COOKIE_DOMAIN || undefined,
    path: "/",
  });
}

export function clearAuthCookie(c: C): void {
  deleteCookie(c, c.env.AUTH_COOKIE_NAME, { domain: c.env.AUTH_COOKIE_DOMAIN || undefined, path: "/" });
}

/** Bearer header first, then the httpOnly cookie. Sets c.var.user (or null). */
export const loadUser: MiddlewareHandler<{ Bindings: Env; Variables: AppVars }> = async (c, next) => {
  let token: string | undefined;
  const auth = c.req.header("authorization");
  if (auth && auth.toLowerCase().startsWith("bearer ")) token = auth.split(/\s+/, 2)[1]?.trim();
  if (!token) token = getCookie(c, c.env.AUTH_COOKIE_NAME);
  let user: DbUser | null = null;
  if (token) {
    const sub = await subjectFromToken(c.env, token);
    if (sub) {
      const rows = await c.var.query("SELECT * FROM users WHERE id = $1", [sub]);
      user = (rows[0] as DbUser | undefined) ?? null;
    }
  }
  c.set("user", user);
  await next();
};

export const requireUser: MiddlewareHandler<{ Bindings: Env; Variables: AppVars }> = async (c, next) => {
  const user = c.var.user;
  if (!user) fail(401, "Not authenticated", { "WWW-Authenticate": "Bearer" });
  if (!user!.is_active) fail(403, "Inactive user");
  await next();
};
