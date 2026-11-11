import { describe, expect, it } from "vitest";
import { modelFor, streamAi } from "../src/ws";

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
