import { subjectFromToken } from "./auth";
import { DOCTORS, systemPrompt } from "./doctors";
import type { Env, Query } from "./env";

const LANGS: Record<string, string> = { kn: "Kannada (ಕನ್ನಡ script)", en: "English", hi: "Hindi (देवनागरी script)" };
const MAX_TEXT = 4000;

const STOP = new Set("the and for are but not you your have has had with that this from they them what when where which who whom how why can could would should will was were been being about into than then there here also just very some any more most such only over after before again does did doing its our out off too few own same both each other these those".split(" "));

/** OR-query over the user's words so natural sentences still match. */
export function searchTerms(text: string): string {
  const words = (text.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []).filter((w) => !STOP.has(w));
  return [...new Set(words)].slice(0, 12).join(" | ");
}

/** Reference excerpts from the knowledge base; never throws (chat works without it). */
export async function retrieve(query: Query, doctorId: string, text: string): Promise<string> {
  const q = searchTerms(text);
  if (!q) return "";
  try {
    const rows = await query(
      `SELECT title, left(content, 700) AS body FROM knowledge_chunks
       WHERE collection = $1 AND approved AND tsv @@ to_tsquery('english', $2)
       ORDER BY ts_rank_cd(tsv, to_tsquery('english', $2)) DESC LIMIT 3`,
      [doctorId === "dr_ananya" ? "mental_wellness" : "medical", q],
    );
    if (!rows.length) return "";
    return (
      "\nReference excerpts (informational only, may be incomplete or outdated; do not read aloud verbatim, never invent sources):\n" +
      rows.map((r, i) => `[${i + 1}] ${r.title}: ${r.body}`).join("\n")
    );
  } catch {
    return "";
  }
}

type Chat = { role: "system" | "user" | "assistant"; content: string };

function tokenOf(chunk: any): string {
  if (typeof chunk?.response === "string") return chunk.response;
  return chunk?.choices?.[0]?.delta?.content ?? "";
}

/** Kannada/Hindi need a larger model; English uses the cheaper one to stretch the free allowance. */
export function modelFor(env: Env, language: string): string {
  return language === "kn" || language === "hi"
    ? env.AI_MODEL_LARGE || "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
    : env.AI_MODEL || "@cf/meta/llama-3.1-8b-instruct";
}

/** Streams a Workers AI completion, calling onToken per piece. */
export async function streamAi(
  env: Env,
  messages: Chat[],
  language: string,
  onToken: (t: string) => void,
  signal: { aborted: boolean },
): Promise<string> {
  if (!env.AI) throw new Error("ai_binding_missing");
  const out: any = await env.AI.run(modelFor(env, language), {
    messages,
    stream: true,
    max_tokens: 320,
    temperature: 0.6,
  });
  const reader = (out as ReadableStream<Uint8Array>).getReader();
  const dec = new TextDecoder();
  let buf = "";
  let full = "";
  while (!signal.aborted) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const t = tokenOf(JSON.parse(data));
        if (t) {
          full += t;
          onToken(t);
        }
      } catch {
        /* partial JSON: ignore */
      }
    }
  }
  if (signal.aborted) await reader.cancel().catch(() => {});
  return full;
}

export async function handleWs(req: Request, env: Env, makeQuery: (e: Env) => Query, sessionId: string) {
  if (req.headers.get("Upgrade") !== "websocket") return new Response("Expected WebSocket", { status: 426 });
  const url = new URL(req.url);
  const cookie = req.headers.get("Cookie")?.match(new RegExp(`(?:^|;\\s*)${env.AUTH_COOKIE_NAME}=([^;]+)`))?.[1];
  const token = url.searchParams.get("token") || cookie || "";

  const pair = new WebSocketPair();
  const [client, server] = [pair[0], pair[1]];
  server.accept();
  const send = (o: unknown) => {
    try {
      server.send(JSON.stringify(o));
    } catch {
      /* closed */
    }
  };

  const query = makeQuery(env);
  const uid = token ? await subjectFromToken(env, token) : null;
  const session = uid
    ? (await query(
        `SELECT s.id, s.status, a.avatar_metadata AS meta FROM sessions s JOIN avatars a ON a.id = s.avatar_id
         WHERE s.id = $1 AND s.user_id = $2`,
        [sessionId, uid],
      ))[0]
    : undefined;
  if (!session || session.status !== "active") {
    server.close(4401, "Unauthorized");
    return new Response(null, { status: 101, webSocket: client });
  }
  const doctorId: string = session.meta?.doctor_id in DOCTORS ? session.meta.doctor_id : "dr_arjun";
  let language = "en";
  let turn = { aborted: false };
  let busy = false;

  server.addEventListener("message", (ev: MessageEvent) => {
    let data: any;
    try {
      data = JSON.parse(String(ev.data));
    } catch {
      return send({ type: "error", message: "Invalid message" });
    }
    switch (data?.type) {
      case "ping":
        return send({ type: "pong" });
      case "set_language":
        language = String(data.language || "en").replace("_", "-").split("-")[0].toLowerCase();
        return;
      case "stop":
      case "interrupt":
        turn.aborted = true;
        return send({ type: "interrupted", message: "Interrupted" });
      case "audio": {
        if (typeof data.audio !== "string" || !data.audio) return send({ type: "error", message: "Missing audio data" });
        if (data.audio.length > 6_000_000) return send({ type: "error", message: "Audio payload too large" });
        turn.aborted = true;
        const mine = (turn = { aborted: false });
        void transcribeThenRun(data.audio, mine);
        return;
      }
      case "text": {
        const text = typeof data.text === "string" ? data.text.trim().slice(0, MAX_TEXT) : "";
        if (!text) return send({ type: "error", message: "Empty message" });
        turn.aborted = true; // barge-in
        const mine = (turn = { aborted: false });
        void run(text, mine);
        return;
      }
      case "set_voice":
        return;
    }
  });

  async function transcribeThenRun(b64: string, mine: { aborted: boolean }) {
    try {
      send({ type: "status", message: "Transcribing audio…", stage: "transcription" });
      const r: any = await env.AI!.run("@cf/openai/whisper-large-v3-turbo", { audio: b64, language });
      const text = String(r?.text ?? "").trim();
      if (!text) return send({ type: "error", message: "Could not transcribe audio" });
      send({ type: "transcription", text });
      await run(text, mine);
    } catch (e) {
      console.error("ws_stt_failed", String((e as Error).message).slice(0, 200));
      send({ type: "error", message: "Could not transcribe audio" });
    }
  }

  async function run(text: string, mine: { aborted: boolean }) {
    while (busy) await new Promise((r) => setTimeout(r, 25));
    busy = true;
    try {
      send({ type: "status", message: "Thinking…", stage: "llm" });
      await query(`INSERT INTO messages (id, session_id, role, content) VALUES ($1,$2,'user',$3)`, [
        crypto.randomUUID(),
        sessionId,
        text,
      ]);
      const hist = (
        await query(`SELECT role, content FROM messages WHERE session_id = $1 ORDER BY created_at DESC LIMIT 14`, [
          sessionId,
        ])
      ).reverse() as Chat[];
      let searchText = text;
      if (language !== "en" && env.AI) {
        // Knowledge base is English: get an English search phrase for Kannada/Hindi input.
        try {
          const t: any = await env.AI.run(env.AI_MODEL || "@cf/meta/llama-3.1-8b-instruct", {
            messages: [{ role: "user", content: `Translate to English, output only the translation:\n${text}` }],
            max_tokens: 80,
          });
          searchText = String(t?.response ?? text);
        } catch {
          /* fall back to original text */
        }
      }
      const refs = await retrieve(query, doctorId, searchText);
      const lang = LANGS[language] ?? language;
      const sys = `${systemPrompt(doctorId)}\nCurrent consultation language: ${lang}. Respond entirely in ${lang}; use 1-3 short sentences, no markdown or lists.${refs}`;
      const reply = await streamAi(env, [{ role: "system", content: sys }, ...hist], language, (t) => send({ type: "token", token: t }), mine);
      if (mine.aborted) return;
      const content = reply.trim() || "I'm here. Could you tell me a little more?";
      await query(`INSERT INTO messages (id, session_id, role, content) VALUES ($1,$2,'assistant',$3)`, [
        crypto.randomUUID(),
        sessionId,
        content,
      ]);
      send({ type: "message", role: "assistant", content });
    } catch (e) {
      console.error("ws_turn_failed", String((e as Error).message).slice(0, 200));
      send({ type: "error", message: "The doctor is busy right now. Please try again in a moment." });
    } finally {
      busy = false;
    }
  }

  return new Response(null, { status: 101, webSocket: client });
}
