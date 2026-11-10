// Vercel (Node runtime) entry. Same app as the Cloudflare Worker; config comes
// from process.env instead of Worker bindings. Node has no 10 ms CPU cap, so
// bcrypt login/register works on the free Hobby plan.
import { createApp } from "../src/app";
import { neonQuery } from "../src/db";
import type { Env } from "../src/env";

const app = createApp(neonQuery);

export default {
  fetch: (req: Request) => app.fetch(req, process.env as unknown as Env),
};
