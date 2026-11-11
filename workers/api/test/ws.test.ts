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
    await expect(streamAi({} as any, [], "en", () => {}, { aborted: false })).rejects.toThrow("ai_binding_missing");
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
