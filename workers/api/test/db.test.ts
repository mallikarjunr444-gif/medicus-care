import { describe, expect, it } from "vitest";
import { neonQuery, parseValue } from "../src/db";
import type { Env } from "../src/env";

const env = { DATABASE_URL: "postgresql://u:p@ep-x-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require" } as Env;

describe("neon http client", () => {
  it("posts to /sql with connection string header and maps typed rows", async () => {
    let seen: any;
    const f = (async (url: string, init: RequestInit) => {
      seen = { url, init };
      return new Response(JSON.stringify({
        fields: [{ name: "id", dataTypeID: 1043 }, { name: "ok", dataTypeID: 16 }, { name: "at", dataTypeID: 1184 }, { name: "j", dataTypeID: 114 }, { name: "n", dataTypeID: 23 }, { name: "nul", dataTypeID: 1043 }],
        rows: [["a1", "t", "2026-11-10 10:32:53.123456+00", '{"k":1}', "7", null]],
      }), { status: 200 });
    }) as unknown as typeof fetch;
    const rows = await neonQuery(env, f)("SELECT $1", ["x", null, { a: 1 }, 3]);
    expect(seen.url).toBe("https://ep-x-pooler.c-7.us-east-1.aws.neon.tech/sql");
    expect(seen.init.headers["Neon-Connection-String"]).toBe(env.DATABASE_URL);
    expect(JSON.parse(seen.init.body).params).toEqual(["x", null, '{"a":1}', "3"]);
    expect(rows[0]).toMatchObject({ id: "a1", ok: true, j: { k: 1 }, n: 7, nul: null });
    expect(rows[0].at).toBeInstanceOf(Date);
    expect((rows[0].at as Date).toISOString()).toBe("2026-11-10T10:32:53.123Z");
  });
  it("parses timestamptz with a non-zero offset", () => {
    expect((parseValue("2026-11-10 16:02:00+05", 1184) as Date).toISOString()).toBe("2026-11-10T11:02:00.000Z");
  });
  it("surfaces database errors without echoing the connection string", async () => {
    const f = (async () => new Response(JSON.stringify({ message: "relation does not exist", code: "42P01" }), { status: 400 })) as unknown as typeof fetch;
    await expect(neonQuery(env, f)("SELECT 1")).rejects.toThrow(/neon_http_400:42P01/);
    await expect(neonQuery(env, f)("SELECT 1")).rejects.not.toThrow(/u:p@/);
  });
});
