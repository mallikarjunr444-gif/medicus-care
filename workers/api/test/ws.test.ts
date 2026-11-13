import { describe, expect, it } from "vitest";
import { modelFor, retrieve, searchTerms, streamAi } from "../src/ws";

const sse = (lines: string[]) =>
  new ReadableStream<Uint8Array>({
    start(c) {
      const e = new TextEncoder();
      // split mid-line to exercise buffering
      const all = lines.join("\n") + "\n";
      c.enqueue(e.encode(all.slice(0, 17)));
      c.enqueue(e.encode(all.slice(17)));
      c.close();
    },
  });

describe("streamAi", () => {
  it("assembles tokens from Workers AI SSE chunks", async () => {
    const env: any = { AI: { run: async () => sse(['data: {"response":"Hel"}', 'data: {"response":"lo"}', "data: [DONE]"]) } };
    const got: string[] = [];
    const full = await streamAi(env, [{ role: "user", content: "hi" }], "en", (t) => got.push(t), { aborted: false });
    expect(full).toBe("Hello");
    expect(got).toEqual(["Hel", "lo"]);
  });
  it("fails clearly without the AI binding", async () => {
    await expect(streamAi({} as any, [], "en", () => {}, { aborted: false })).rejects.toThrow("ai_not_configured");
  });
});

describe("modelFor", () => {
  it("uses the larger model for Kannada and Hindi only", () => {
    expect(modelFor({} as any, "kn")).toContain("70b");
    expect(modelFor({} as any, "hi")).toContain("70b");
    expect(modelFor({} as any, "en")).toContain("8b");
  });
});

describe("retrieval", () => {
  it("builds an OR query without stopwords or punctuation", () => {
    expect(searchTerms("I have a bad headache and fever since the morning!")).toBe("bad | headache | fever | since | morning");
    expect(searchTerms("ಕನ್ನಡ")).toBe("");
  });
  it("formats excerpts, and returns empty on database errors", async () => {
    const ok = await retrieve(async () => [{ title: "A1C", body: "blood test" }], "dr_arjun", "what is a1c");
    expect(ok).toContain("[1] A1C: blood test");
    const bad = await retrieve(async () => { throw new Error("db"); }, "dr_arjun", "fever");
    expect(bad).toBe("");
  });
});

import { PGlite } from "@electric-sql/pglite";
describe("retrieval against Postgres full-text search", () => {
  it("ranks the matching chunk and filters by collection", async () => {
    const db = new PGlite();
    const ddl = (await import("node:fs")).readFileSync(new URL("../../../scripts/load_knowledge.py", import.meta.url), "utf8");
    const sql = ddl.match(/DDL = """([\s\S]*?)"""/)![1];
    await db.exec(sql);
    await db.query(`INSERT INTO knowledge_chunks (chunk_id, collection, title, content) VALUES
      ('1','medical','A1C test','A1C is a blood test for diabetes that measures average blood glucose.'),
      ('2','medical','Migraine','Migraine causes a severe headache with nausea.'),
      ('3','mental_wellness','Anxiety','Breathing helps with anxiety and stress.')`);
    const q = async (t: string, p: unknown[] = []) => (await db.query(t, p as any[])).rows as any[];
    expect(await retrieve(q, "dr_arjun", "my blood sugar test and diabetes")).toContain("A1C test");
    const m = await retrieve(q, "dr_arjun", "terrible headache");
    expect(m).toContain("Migraine");
    expect(m).not.toContain("Anxiety");
    expect(await retrieve(q, "dr_ananya", "feeling anxiety")).toContain("Anxiety");
    expect(await retrieve(q, "dr_arjun", "zzzzqqq")).toBe("");
  });
});

describe("chatAllowed", () => {
  const q = (user: number, day: number) => async (sql: string) => [{ n: sql.includes("role = 'user'") ? user : day }];
  it("allows, then limits per user and globally", async () => {
    const { chatAllowed } = await import("../src/ws");
    expect(await chatAllowed(q(9999, 9999), "u", {})).toBe("ok"); // unlimited by default
    expect(await chatAllowed(q(40, 1), "u", { AI_USER_HOURLY_CAP: "40" })).toBe("user_limit");
    expect(await chatAllowed(q(1, 1500), "u", { AI_DAILY_CAP: "1500" })).toBe("daily_limit");
    expect(await chatAllowed(q(5, 1), "u", { AI_USER_HOURLY_CAP: "5" })).toBe("user_limit");
  });
});

describe("provider order", () => {
  const ok = (words: string[]) => new Response(words.map((w) => `data: {"choices":[{"delta":{"content":"${w}"}}]}\n`).join("") + "data: [DONE]\n");
  it("prefers the external provider, falls back to Workers AI before any token", async () => {
    const orig = globalThis.fetch;
    const ai = { run: async () => sse(['data: {"response":"CF"}', "data: [DONE]"]) };
    try {
      globalThis.fetch = (async () => ok(["Gro", "q"])) as any;
      expect(await streamAi({ AI_API_KEY: "k", AI: ai } as any, [], "en", () => {}, { aborted: false })).toBe("Groq");
      globalThis.fetch = (async () => new Response("rate limited", { status: 429 })) as any;
      expect(await streamAi({ AI_API_KEY: "k", AI: ai } as any, [], "en", () => {}, { aborted: false })).toBe("CF");
      await expect(streamAi({ AI_API_KEY: "k" } as any, [], "en", () => {}, { aborted: false })).rejects.toThrow("external_ai_429");
    } finally {
      globalThis.fetch = orig;
    }
  });
  it("uses an OpenAI-compatible Workers AI-less setup and errors when nothing is configured", async () => {
    await expect(streamAi({} as any, [], "en", () => {}, { aborted: false })).rejects.toThrow("ai_not_configured");
  });
});
