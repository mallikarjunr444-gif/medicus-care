import type { Env, Query } from "./env";

/**
 * Minimal client for Neon's SQL-over-HTTP endpoint (the same transport the
 * @neondatabase/serverless `neon()` function uses). One request per query: no
 * TCP pool to exhaust on Workers, and ~150 KB lighter than the full driver.
 * Values arrive as text; we convert the types this API actually uses.
 */
export function parseValue(text: string | null, oid: number): unknown {
  if (text === null) return null;
  switch (oid) {
    case 16: return text === "t" || text === "true";
    case 20: // int8 (counts); safe as a number for our ranges
    case 21: case 23: return Number(text);
    case 700: case 701: case 1700: return Number(text);
    case 114: case 3802: return JSON.parse(text);
    case 1114: case 1184: return new Date(text.replace(" ", "T").replace(/([+-]\d\d)$/, "$1:00"));
    default: return text;
  }
}

const toParam = (v: unknown): string | null =>
  v === null || v === undefined ? null : typeof v === "string" ? v : typeof v === "object" ? JSON.stringify(v) : String(v);

export function neonQuery(env: Env, fetchImpl: typeof fetch = fetch): Query {
  const url = new URL(env.DATABASE_URL);
  const endpoint = `https://${url.hostname}/sql`;
  return async (text, params = []) => {
    const res = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Neon-Connection-String": env.DATABASE_URL,
        "Neon-Raw-Text-Output": "true",
        "Neon-Array-Mode": "true",
      },
      body: JSON.stringify({ query: text, params: params.map(toParam) }),
    });
    const body: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`neon_http_${res.status}:${body?.code ?? ""}:${body?.message ?? "query failed"}`);
    const fields: { name: string; dataTypeID: number }[] = body.fields ?? [];
    return (body.rows ?? []).map((row: (string | null)[]) => {
      const o: Record<string, unknown> = {};
      fields.forEach((f, i) => (o[f.name] = parseValue(row[i], f.dataTypeID)));
      return o;
    });
  };
}
