import { neon } from "@neondatabase/serverless";
import type { Env, Query } from "./env";

/** Neon serverless driver over HTTP: no TCP pool to exhaust, fits Workers. */
export function neonQuery(env: Env): Query {
  const sql = neon(env.DATABASE_URL);
  return (text, params = []) => sql.query(text, params as any[]) as Promise<Record<string, any>[]>;
}
