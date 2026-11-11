import { Hono } from "hono/tiny";
import { requireUser } from "../auth";
import type { AppVars, Env } from "../env";
import { fail } from "../http";

/** Voice cloning needs a GPU service; the free edge API only reports that clearly. */
export const voices = new Hono<{ Bindings: Env; Variables: AppVars }>();
voices.use("*", requireUser);
voices.get("/", (c) => c.json([]));
voices.all("/*", () => fail(503, "Voice cloning isn't available on the free server. Doctors speak with your device's built-in voice."));
