# MediCare API edge (Cloudflare Workers / Vercel)

Hono API for users, sessions and messages. Same routes and response shapes as the
FastAPI backend. AI chat, WebSocket, avatars, voices and admin stay on the Python
service.

## Deploy (free)
1. In Neon, copy the pooled connection string of the `medicare` branch (schema is already applied).
2. Add GitHub repository secrets: `CLOUDFLARE_API_TOKEN` (Edit Cloudflare Workers),
   `CLOUDFLARE_ACCOUNT_ID`, `DATABASE_URL`, `JWT_SECRET_KEY` (`openssl rand -base64 48`), optional `SENTRY_DSN`.
3. Run the **Deploy API Worker** workflow (or push to `main`).

Local: `cd workers/api && npm ci && npm test && npx wrangler dev`.

## Notes
- Password hashing (bcrypt) runs inside Postgres via `pgcrypto`, because the Workers Free
  plan allows ~10 ms CPU per request. Existing Python bcrypt hashes keep working.
- Free plan limits: 100,000 requests/day, 10 ms CPU, 128 MB, 50 subrequests, ~3 MB script.
- Set `CORS_ORIGINS` (wrangler.jsonc, production env) to the exact Firebase origins.
