import { validationError } from "./http";

type Err = { loc: (string | number)[]; msg: string; type: string };

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const USERNAME_MIN = 3;
const USERNAME_MAX = 39;
const USERNAME_RE = /^[A-Za-z0-9](?:[A-Za-z0-9_-]*[A-Za-z0-9])?$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (body && typeof body === "object" && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {
    /* fallthrough */
  }
  return validationError([{ loc: ["body"], msg: "Input should be a valid dictionary or object", type: "model_attributes_type" }]);
}

export function checkEmail(v: unknown, errs: Err[]): string | undefined {
  if (typeof v !== "string" || !EMAIL_RE.test(v)) {
    errs.push({ loc: ["body", "email"], msg: "value is not a valid email address", type: "value_error" });
    return;
  }
  return v.toLowerCase(); // one representation per address
}

export function checkUsername(v: unknown, errs: Err[]): string | undefined {
  if (typeof v !== "string" || v.length < USERNAME_MIN || v.length > USERNAME_MAX || !USERNAME_RE.test(v)) {
    errs.push({ loc: ["body", "username"], msg: "String should match pattern and be 3-39 characters", type: "string_pattern_mismatch" });
    return;
  }
  return v;
}

export function checkPassword(v: unknown, errs: Err[]): string | undefined {
  if (typeof v !== "string" || v.length < PASSWORD_MIN || v.length > PASSWORD_MAX) {
    errs.push({ loc: ["body", "password"], msg: "String should have at least 8 and at most 128 characters", type: "string_length" });
    return;
  }
  return v;
}

export function checkOptionalName(v: unknown, errs: Err[]): string | null | undefined {
  if (v === undefined || v === null) return v as null | undefined;
  if (typeof v !== "string" || v.length > 200) {
    errs.push({ loc: ["body", "full_name"], msg: "String should have at most 200 characters", type: "string_too_long" });
    return;
  }
  return v;
}

export function requireString(v: unknown, field: string, errs: Err[], max?: number): string | undefined {
  if (typeof v !== "string" || (max !== undefined && v.length > max)) {
    errs.push({ loc: ["body", field], msg: "Field required or invalid", type: "string_type" });
    return;
  }
  return v;
}

export function finish(errs: Err[]): void {
  if (errs.length) validationError(errs);
}

export function intParam(v: string | undefined, def: number, min: number, max: number, name: string): number {
  if (v === undefined) return def;
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) {
    validationError([{ loc: ["query", name], msg: `Input should be between ${min} and ${max}`, type: "int_range" }]);
  }
  return n;
}
