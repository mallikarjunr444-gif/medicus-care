export interface Env {
  // Secrets (wrangler secret put)
  DATABASE_URL: string;
  JWT_SECRET_KEY: string;
  SENTRY_DSN?: string;
  // Vars
  ENVIRONMENT: string;
  CORS_ORIGINS: string;
  AUTH_COOKIE_NAME: string;
  AUTH_COOKIE_SECURE: string;
  AUTH_COOKIE_SAMESITE: string;
  AUTH_COOKIE_DOMAIN?: string;
  JWT_EXPIRATION_HOURS: string;
  GUEST_ACCOUNTS_ENABLED: string;
  AI_MODEL?: string;
  AI_MODEL_LARGE?: string;
  // Bindings
  AI?: { run(model: string, input: unknown): Promise<unknown> };
  RATE_LIMITER?: { limit(opts: { key: string }): Promise<{ success: boolean }> };
}

/** Runs one parameterised SQL statement and returns the rows. */
export type Query = (text: string, params?: unknown[]) => Promise<Record<string, any>[]>;

export interface AppVars {
  query: Query;
  user: DbUser | null;
}

export interface DbUser {
  id: string;
  email: string;
  username: string;
  hashed_password: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  is_guest: boolean;
  created_at: Date | string;
}
