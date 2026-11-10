import { HTTPException } from "hono/http-exception";

/** FastAPI-shaped error: `{ "detail": "..." }`. */
export function fail(status: 400 | 401 | 403 | 404 | 409 | 500, detail: string, headers?: Record<string, string>): never {
  throw new HTTPException(status, {
    res: new Response(JSON.stringify({ detail }), {
      status,
      headers: { "content-type": "application/json", ...(headers ?? {}) },
    }),
  });
}

export function validationError(errors: { loc: (string | number)[]; msg: string; type: string }[]): never {
  throw new HTTPException(422, {
    res: new Response(JSON.stringify({ detail: errors }), {
      status: 422,
      headers: { "content-type": "application/json" },
    }),
  });
}

export const iso = (v: Date | string | null | undefined): string | null =>
  v == null ? null : new Date(v).toISOString();
