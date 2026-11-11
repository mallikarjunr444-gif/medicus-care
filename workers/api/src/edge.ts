// Slim Cloudflare entry without the Sentry SDK. Used for the minimal upload
// bundle; src/index.ts adds Sentry once a DSN exists. Errors are caught and
// logged without request bodies.
import { createApp } from "./app";
import { neonQuery } from "./db";

export default createApp(neonQuery);
