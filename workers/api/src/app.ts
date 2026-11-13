import { Hono } from "hono/tiny";
import { doctors } from "./doctors";
import { avatars } from "./routes/avatars";
import { voices } from "./routes/voices";
import { admin } from "./routes/admin";
import { conversations } from "./routes/conversations";
import { consultationReports } from "./routes/consultationReports";
import { doctorActions } from "./doctorActions";
import { handleWs } from "./ws";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { HTTPException } from "hono/http-exception";
import { loadUser } from "./auth";
import type { AppVars, Env, Query } from "./env";
import { messages } from "./routes/messages";
import { sessions } from "./routes/sessions";
import { users } from "./routes/users";

const HEALTH_TIMEOUT_MS = 3000;

/** `makeQuery` is injected so tests can swap in an in-process Postgres. */
export interface AppOptions {
  /** Called with unexpected errors (e.g. Sentry.captureException). Never receives request bodies. */
  report?: (err: unknown) => void;
}

// Fallback limiter for hosts without the Cloudflare binding (per warm instance).
const FALLBACK_LIMIT = 120;
const hits = new Map<string, { n: number; reset: number }>();
function fallbackAllow(key: string): boolean {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || now > h.reset) {
    if (hits.size > 5000) hits.clear();
    hits.set(key, { n: 1, reset: now + 60_000 });
    return true;
  }
  return ++h.n <= FALLBACK_LIMIT;
}

export function createApp(makeQuery: (env: Env) => Query, opts: AppOptions = {}) {
  const app = new Hono<{ Bindings: Env; Variables: AppVars }>();

  app.use("*", secureHeaders());
  app.use("*", async (c, next) => {
    const id = c.req.header("cf-ray") ?? crypto.randomUUID();
    await next();
    c.res.headers.set("x-request-id", id);
    if (c.req.path.startsWith("/api/")) c.res.headers.set("cache-control", "no-store");
  });
  app.use("*", (c, next) =>
    cors({
      origin: (origin) => (c.env.CORS_ORIGINS.split(",").map((s) => s.trim()).includes(origin) ? origin : null),
      credentials: true,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Authorization", "Content-Type"],
      maxAge: 600,
    })(c, next),
  );

  // Per-identity limiter (Cloudflare's rate-limit binding). Skipped if unbound.
  app.use("/api/*", async (c, next) => {
    const key = (c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for")?.split(",")[0] ?? "unknown").trim();
    const ok = c.env.RATE_LIMITER ? (await c.env.RATE_LIMITER.limit({ key })).success : fallbackAllow(key);
    if (!ok) return c.json({ detail: "Rate limit exceeded. Try again later." }, 429, { "Retry-After": "60" });
    await next();
  });

  app.use("*", async (c, next) => {
    c.set("query", makeQuery(c.env));
    c.set("user", null);
    await next();
  });

  app.get("/", (c) => c.json({ name: "MediCare API (edge)", status: "running" }));

  app.get("/health", async (c) => {
    let database = "connected";
    try {
      await Promise.race([
        c.var.query("SELECT 1"),
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), HEALTH_TIMEOUT_MS)),
      ]);
    } catch {
      database = "disconnected";
    }
    const healthy = database === "connected";
    return c.json(
      { status: healthy ? "healthy" : "unhealthy", environment: c.env.ENVIRONMENT, timestamp: new Date().toISOString(), services: { database } },
      healthy ? 200 : 503,
    );
  });

  app.use("/api/v1/*", loadUser);
  app.route("/api/v1/doctors", doctors);
  app.route("/api/v1/avatars", avatars);
  app.route("/api/v1/voices", voices);
  app.route("/api/v1/admin", admin);
  app.route("/api/v1/conversations", conversations);
  app.route("/api/v1/consultation-reports", consultationReports);
  app.route("/api/v1/doctor", doctorActions);
  app.route("/api/v1/users", users);
  app.route("/api/v1/sessions", sessions);
  app.route("/api/v1/messages", messages);

  app.notFound((c) => c.json({ detail: "Not Found" }, 404));

  app.onError((err, c) => {
    if (err instanceof HTTPException) return err.getResponse();
    // Never log request bodies: they can contain patient-sensitive text.
    opts.report?.(err);
    console.error("unhandled_error", err instanceof Error ? err.message : "unknown");
    return c.json({ detail: "Internal server error" }, 500);
  });

  // The existing frontend calls FastAPI-style URLs with a trailing slash
  // (e.g. /api/v1/sessions/). Hono distinguishes `/x` from `/x/`, so strip
  // it before routing; method, headers and body are preserved.
  const route = app.fetch.bind(app);
  app.fetch = (req, env, ctx) => {
    const url = new URL(req.url);
    // WebSocket upgrades bypass Hono middleware (101 responses have immutable headers).
    const ws = url.pathname.match(/^\/ws\/session\/([^/]+)\/?$/);
    if (ws) return handleWs(req, env as Env, makeQuery, decodeURIComponent(ws[1]));
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.replace(/\/+$/, "") || "/";
      req = new Request(url, req);
    }
    return route(req, env, ctx);
  };

  return app;
}
