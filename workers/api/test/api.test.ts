import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import type { Env } from "../src/env";

// Hash produced by the Python backend's bcrypt (cost 12) for "Correct-Horse-9".
const PY_HASH = "$2b$12$dudJjjyTrWd9iJGPz977AOt.8ESymL99hKaU1sYU7fkDyg..tjKKm";

const env: Env = {
  DATABASE_URL: "unused",
  JWT_SECRET_KEY: "test-secret-test-secret-test-secret-123456",
  ENVIRONMENT: "test",
  CORS_ORIGINS: "https://app.example.web.app",
  AUTH_COOKIE_NAME: "access_token",
  AUTH_COOKIE_SECURE: "false",
  AUTH_COOKIE_SAMESITE: "lax",
  JWT_EXPIRATION_HOURS: "24",
  GUEST_ACCOUNTS_ENABLED: "true",
};

let db: PGlite;
let app: ReturnType<typeof createApp>;
const call = (path: string, init: RequestInit = {}) => app.request(path, init, env);
const json = (token: string | null, body?: unknown, method = "POST"): RequestInit => ({
  method,
  headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
  body: body === undefined ? undefined : JSON.stringify(body),
});
const auth = (token: string): RequestInit => ({ headers: { authorization: `Bearer ${token}` } });

beforeAll(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  await db.exec("CREATE EXTENSION IF NOT EXISTS pgcrypto;");
  await db.exec(readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));
  app = createApp(() => async (text, params = []) => (await db.query(text, params as any[])).rows as any[]);
});

async function guest() {
  const r = await call("/api/v1/users/guest", { method: "POST" });
  expect(r.status).toBe(201);
  return (await r.json()).access_token as string;
}

describe("health + cors + headers", () => {
  it("health is 200 with DB connected", async () => {
    const r = await call("/health");
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.status).toBe("healthy");
    expect(b.services.database).toBe("connected");
  });
  it("allows only the configured Firebase origin", async () => {
    const ok = await call("/health", { headers: { origin: "https://app.example.web.app" } });
    expect(ok.headers.get("access-control-allow-origin")).toBe("https://app.example.web.app");
    expect(ok.headers.get("access-control-allow-credentials")).toBe("true");
    const bad = await call("/health", { headers: { origin: "https://evil.example" } });
    expect(bad.headers.get("access-control-allow-origin")).toBeNull();
  });
  it("sets security headers", async () => {
    const r = await call("/health");
    expect(r.headers.get("x-content-type-options")).toBe("nosniff");
  });
});

describe("users/auth", () => {
  it("register -> UserResponse shape, no secrets, email lower-cased", async () => {
    const r = await call("/api/v1/users/register", json(null, { email: "Ann@Example.com", username: "ann_1", password: "Correct-Horse-9", full_name: "Ann" }));
    expect(r.status).toBe(201);
    const b = await r.json();
    expect(Object.keys(b).sort()).toEqual(["created_at", "email", "full_name", "id", "is_active", "is_guest", "username"]);
    expect(b.email).toBe("ann@example.com");
    expect(JSON.stringify(b)).not.toContain("hash");
  });
  it("duplicate email/username -> 409 with FastAPI detail", async () => {
    let r = await call("/api/v1/users/register", json(null, { email: "ann@example.com", username: "other", password: "Correct-Horse-9" }));
    expect(r.status).toBe(409);
    expect(await r.json()).toEqual({ detail: "Email already registered" });
    r = await call("/api/v1/users/register", json(null, { email: "x@example.com", username: "ann_1", password: "Correct-Horse-9" }));
    expect(await r.json()).toEqual({ detail: "Username already taken" });
  });
  it("validation: short password, bad username, bad email -> 422", async () => {
    for (const bad of [
      { email: "a@b.co", username: "okname", password: "short" },
      { email: "a@b.co", username: "-bad-", password: "Correct-Horse-9" },
      { email: "nope", username: "okname", password: "Correct-Horse-9" },
    ]) {
      const r = await call("/api/v1/users/register", json(null, bad));
      expect(r.status).toBe(422);
    }
  });
  it("login (form) works, sets httpOnly cookie, case-insensitive email", async () => {
    const r = await call("/api/v1/users/login", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: "ANN@example.com", password: "Correct-Horse-9" }),
    });
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.token_type).toBe("bearer");
    const cookie = r.headers.get("set-cookie")!;
    expect(cookie).toMatch(/access_token=/);
    expect(cookie.toLowerCase()).toContain("httponly");
    const me = await call("/api/v1/users/me", auth(b.access_token));
    expect(me.status).toBe(200);
  });
  it("wrong password / unknown user -> 401 same message", async () => {
    for (const u of ["ann@example.com", "ghost@example.com"]) {
      const r = await call("/api/v1/users/login", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: u, password: "wrong-password" }),
      });
      expect(r.status).toBe(401);
      expect(await r.json()).toEqual({ detail: "Incorrect email or password" });
    }
  });
  it("verifies a password hashed by the Python backend (bcrypt cost 12, checked via pgcrypto)", async () => {
    await db.query(
      "INSERT INTO users (id,email,username,hashed_password) VALUES ('py-1','py@example.com','pyuser',$1)",
      [PY_HASH],
    );
    const r = await call("/api/v1/users/login", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: "py@example.com", password: "Correct-Horse-9" }),
    });
    expect(r.status).toBe(200);
  });
  it("guest account cannot be logged into with any password", async () => {
    await guest();
    const g = (await db.query("SELECT email FROM users WHERE is_guest LIMIT 1")).rows[0] as any;
    const r = await call("/api/v1/users/login", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: g.email, password: "*" }),
    });
    expect(r.status).toBe(401);
  });
  it("auth required, bad/expired/alg-none tokens rejected", async () => {
    expect((await call("/api/v1/users/me")).status).toBe(401);
    expect((await call("/api/v1/users/me", auth("garbage"))).status).toBe(401);
    const none = `${btoa('{"alg":"none"}')}.${btoa('{"sub":"py-1","exp":9999999999}')}.`;
    expect((await call("/api/v1/users/me", auth(none))).status).toBe(401);
  });
  it("rejects expired and wrong-secret tokens", async () => {
    const { createAccessToken } = await import("../src/auth");
    const good = await createAccessToken(env, "py-1");
    expect((await call("/api/v1/users/me", auth(good))).status).toBe(200);
    expect((await call("/api/v1/users/me", auth(await createAccessToken({ ...env, JWT_SECRET_KEY: "other-secret-other-secret-other-1234" }, "py-1")))).status).toBe(401);
    expect((await call("/api/v1/users/me", auth(await createAccessToken({ ...env, JWT_EXPIRATION_HOURS: "-1" }, "py-1")))).status).toBe(401);
  });
  it("PUT /me updates and enforces uniqueness; list is superuser-only", async () => {
    const t = await guest();
    const r = await call("/api/v1/users/me", json(t, { full_name: "Renamed" }, "PUT"));
    expect((await r.json()).full_name).toBe("Renamed");
    const dup = await call("/api/v1/users/me", json(t, { username: "ann_1" }, "PUT"));
    expect(dup.status).toBe(409);
    expect((await call("/api/v1/users/", auth(t))).status).toBe(403);
  });
  it("cannot read another user's profile", async () => {
    const t = await guest();
    expect((await call("/api/v1/users/py-1", auth(t))).status).toBe(403);
  });
});

describe("sessions + messages", () => {
  let token: string, other: string, sessionId: string, messageId: string;
  beforeAll(async () => {
    token = await guest();
    other = await guest();
    const uid = (await db.query("SELECT id FROM users ORDER BY created_at DESC OFFSET 1 LIMIT 1")).rows[0] as any;
    await db.query("INSERT INTO avatars (id,user_id,name,image_url,s3_key,status) VALUES ('av-ready',$1,'Dr','u','k','ready'),('av-wait',$1,'Dr2','u','k','processing')", [uid.id]);
  });
  it("create session: 404 / 400 / 201 matches SessionResponse", async () => {
    expect((await call("/api/v1/sessions/create", json(token, { avatar_id: "nope" }))).status).toBe(404);
    expect((await call("/api/v1/sessions/create", json(token, { avatar_id: "av-wait" }))).status).toBe(400);
    const r = await call("/api/v1/sessions/create", json(token, { avatar_id: "av-ready", settings: { doctor_id: "dr_ananya" } }));
    expect(r.status).toBe(201);
    const b = await r.json();
    expect(Object.keys(b).sort()).toEqual(["avatar_id", "ended_at", "id", "settings", "started_at", "status", "user_id"]);
    expect(b.settings).toEqual({ doctor_id: "dr_ananya" });
    sessionId = b.id;
  });
  it("another user cannot use the avatar or read the session (403)", async () => {
    expect((await call("/api/v1/sessions/create", json(other, { avatar_id: "av-ready" }))).status).toBe(403);
    expect((await call(`/api/v1/sessions/${sessionId}`, auth(other))).status).toBe(403);
    expect((await call(`/api/v1/messages/session/${sessionId}`, auth(other))).status).toBe(403);
  });
  it("send / list / get / edit message", async () => {
    const r = await call("/api/v1/messages/send", json(token, { session_id: sessionId, content: "I have a headache" }));
    expect(r.status).toBe(201);
    const m = await r.json();
    expect(Object.keys(m).sort()).toEqual(["audio_url", "content", "content_type", "created_at", "id", "message_metadata", "role", "session_id", "video_url"]);
    expect(m.role).toBe("user");
    messageId = m.id;
    const list = await (await call(`/api/v1/messages/session/${sessionId}`, auth(token))).json();
    expect(list).toHaveLength(1);
    const ed = await call(`/api/v1/messages/${messageId}`, json(token, { content: "  edited  " }, "PATCH"));
    expect((await ed.json()).content).toBe("edited");
    expect((await call(`/api/v1/messages/${messageId}`, json(token, { content: "" }, "PATCH"))).status).toBe(422);
  });
  it("list sessions + pagination validation", async () => {
    const l = await (await call("/api/v1/sessions/", auth(token))).json();
    expect(l).toHaveLength(1);
    expect((await call("/api/v1/sessions/?limit=999", auth(token))).status).toBe(422);
  });
  it("export, end (blocks sends), delete cascades", async () => {
    const ex = await call(`/api/v1/sessions/${sessionId}/export`, auth(token));
    expect(ex.headers.get("content-disposition")).toContain("attachment");
    expect((await ex.json()).messages).toHaveLength(1);
    const end = await (await call(`/api/v1/sessions/${sessionId}/end`, json(token))).json();
    expect(end.status).toBe("ended");
    expect(end.ended_at).not.toBeNull();
    expect((await call("/api/v1/messages/send", json(token, { session_id: sessionId, content: "x" }))).status).toBe(400);
    expect((await call(`/api/v1/sessions/${sessionId}`, { method: "DELETE", headers: { authorization: `Bearer ${token}` } })).status).toBe(204);
    expect((await db.query("SELECT 1 FROM messages WHERE session_id = $1", [sessionId])).rows).toHaveLength(0);
    expect((await call(`/api/v1/sessions/${sessionId}`, auth(token))).status).toBe(404);
  });
});

describe("errors", () => {
  it("unknown route -> 404 detail; DB failure -> 500 generic, no leak", async () => {
    expect((await call("/nope")).status).toBe(404);
    const broken = createApp(() => async () => { throw new Error("secret-connection-string"); });
    const r = await broken.request("/api/v1/users/register", json(null, { email: "a@b.co", username: "okname", password: "Correct-Horse-9" }), env);
    expect(r.status).toBe(500);
    expect(JSON.stringify(await r.json())).not.toContain("secret");
  });
  it("health reports 503 when the database is down", async () => {
    const broken = createApp(() => async () => { throw new Error("down"); });
    const r = await broken.request("/health", {}, env);
    expect(r.status).toBe(503);
  });
});

describe("doctor avatars", () => {
  it("creates a ready avatar per doctor and lets a session start from it", async () => {
    const g = await (await call("/api/v1/users/guest", json(null))).json();
    const t = g.access_token as string;
    const r = await call("/api/v1/doctors/dr_arjun/avatar", json(t));
    expect(r.status).toBe(200);
    const a = await r.json();
    expect(a.name).toBe("Dr. Smit");
    expect(a.status).toBe("ready");
    const again = await (await call("/api/v1/doctors/dr_arjun/avatar", json(t))).json();
    expect(again.id).toBe(a.id);
    const s = await call("/api/v1/sessions/create", json(t, { avatar_id: a.id }));
    expect(s.status).toBe(201);
    expect((await call("/api/v1/doctors/nobody/avatar", json(t))).status).toBe(404);
  });
});

describe("doctor actions", () => {
  it("lists specialists, analyses a report and requires confirmation to book", async () => {
    const l = await (await call("/api/v1/doctor/specialists?specialty=cardio&district=bengaluru")).json();
    expect(l.count).toBe(1);
    const r = await (await call("/api/v1/doctor/reports/analyze", json(null, { report_text: "Hb 11 and TSH 6" }))).json();
    expect(r.parameters_analyzed.map((p: any) => p.parameter)).toEqual(["Hemoglobin (Hb)", "Thyroid Stimulating Hormone (TSH)"]);
    const bad = await call("/api/v1/doctor/appointments/request", json(null, { specialist_id: "DOC-CKM-01", patient_confirmed: false }));
    expect(bad.status).toBe(400);
    const ok = await (await call("/api/v1/doctor/appointments/request", json(null, { specialist_id: "DOC-CKM-01", preferred_date: "2026-12-01", preferred_time_slot: "10:00" }))).json();
    expect(ok.booking_id).toMatch(/^APT-DOC-CKM-01-/);
  });
});
