import * as Sentry from "@sentry/cloudflare";
import { createApp } from "./app";
import { neonQuery } from "./db";
import type { Env } from "./env";

const app = createApp(neonQuery, { report: (e) => Sentry.captureException(e) });

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: env.SENTRY_DSN,
    environment: env.ENVIRONMENT,
    tracesSampleRate: 0,
  }),
  app,
);
